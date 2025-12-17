
import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();

/**
 * ROUTE 1 - POST : Créer ou mettre à jour la description d'un événement
 * Endpoint: POST /api/events/:id/description
 * Body: { description: "description de l'événement" }
 */
router.post('/:id/description', async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

   
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'événement invalide'
      });
    }

    //validation de la description
    if (!description || validator.isEmpty(description.trim())) {
      return res.status(400).json({
        success: false,
        message: 'La description ne peut pas être vide'
      });
    }

    if (!validator.isLength(description, { min: 10, max: 2000 })) {
      return res.status(400).json({
        success: false,
        message: 'La description doit contenir entre 10 et 2000 caractères'
      });
    }

    //verif si l'événement existe
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    //maj description
    event.description = description.trim();
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Description mise à jour avec succès',
      data: {
        _id: event._id,
        title: event.title,
        description: event.description,
        updatedAt: event.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la description',
      error: error.message
    });
  }
});

/**
 * ROUTE 2 - GET : Récupérer les descriptions des événements avec filtres avancés
 * Endpoint: GET /api/events/descriptions
 */
router.get('/descriptions', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status,
      minLength,
      page = 1, 
      limit = 10,
      sortBy = 'newest'
    } = req.query;

    //construction du filtre
    const filter = {};
    
    //recherche textuelle dans les descriptions
    if (search && !validator.isEmpty(search.trim())) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    
    //filtre par catégorie
    if (category) {
      filter.category = category;
    }
    
    //filtre par statut
    if (status) {
      filter.status = status;
    }

    //filtre par longueur minimale de description
    if (minLength) {
      filter.$expr = {
        $gte: [{ $strLenCP: "$description" }, parseInt(minLength)]
      };
    }

    //pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sortBy === 'oldest' ? 1 : -1;

    //requête avec projection optimisée
    const events = await Event.find(filter)
      .select('title description date location category status organizer')
      .sort({ date: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    //comptage total pour la pagination
    const total = await Event.countDocuments(filter);

    //ajouter la longueur de chaque description
    const eventsWithLength = events.map(event => ({
      ...event,
      descriptionLength: event.description.length
    }));

    res.status(200).json({
      success: true,
      data: eventsWithLength,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        eventsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des descriptions',
      error: error.message
    });
  }
});

/**
 * ROUTE 3 - GET : Agrégation MongoDB - Statistiques sur les descriptions
 */
router.get('/descriptions/stats', async (req, res) => {
  try {
    //pipeline d'agrégation MongoDB
    const stats = await Event.aggregate([
      //ajouter la longueur de la description
      {
        $addFields: {
          descriptionLength: { $strLenCP: "$description" }
        }
      },
      
      //regroupement par catégorie
      {
        $group: {
          _id: "$category",
          nombreEvenements: { $sum: 1 },
          longueurMoyenne: { $avg: "$descriptionLength" },
          longueurMin: { $min: "$descriptionLength" },
          longueurMax: { $max: "$descriptionLength" },
          evenements: {
            $push: {
              titre: "$title",
              description: "$description",
              longueur: "$descriptionLength",
              date: "$date",
              statut: "$status"
            }
          }
        }
      },
      
      //tri par nombre d'événements décroissant
      {
        $sort: { nombreEvenements: -1 }
      },
      
      //projection pour formater les résultats
      {
        $project: {
          _id: 0,
          categorie: "$_id",
          nombreEvenements: 1,
          longueurMoyenne: { $round: ["$longueurMoyenne", 2] },
          longueurMin: 1,
          longueurMax: 1,
          evenements: 1
        }
      }
    ]);

    //agreg supplémentaire top 5 des descriptions les plus longues
    const topDescriptions = await Event.aggregate([
      {
        $addFields: {
          descriptionLength: { $strLenCP: "$description" }
        }
      },
      {
        $sort: { descriptionLength: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 0,
          titre: "$title",
          categorie: "$category",
          longueurDescription: "$descriptionLength",
          extraitDescription: { $substr: ["$description", 0, 100] },
          date: "$date",
          organisateur: "$organizer"
        }
      }
    ]);

    //agreg apartition par statut
    const statsByStatus = await Event.aggregate([
      {
        $addFields: {
          descriptionLength: { $strLenCP: "$description" }
        }
      },
      {
        $group: {
          _id: "$status",
          total: { $sum: 1 },
          longueurMoyenneDescription: { $avg: "$descriptionLength" }
        }
      },
      {
        $project: {
          _id: 0,
          statut: "$_id",
          nombreEvenements: "$total",
          longueurMoyenne: { $round: ["$longueurMoyenneDescription", 2] }
        }
      },
      {
        $sort: { nombreEvenements: -1 }
      }
    ]);

    //statistiques globales
    const globalStats = await Event.aggregate([
      {
        $addFields: {
          descriptionLength: { $strLenCP: "$description" }
        }
      },
      {
        $group: {
          _id: null,
          totalEvenements: { $sum: 1 },
          longueurMoyenneGlobale: { $avg: "$descriptionLength" },
          longueurTotale: { $sum: "$descriptionLength" }
        }
      },
      {
        $project: {
          _id: 0,
          totalEvenements: 1,
          longueurMoyenneGlobale: { $round: ["$longueurMoyenneGlobale", 2] },
          longueurTotale: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Statistiques des descriptions d'événements",
      data: {
        statistiquesGlobales: globalStats[0] || {},
        statistiquesParCategorie: stats,
        topDescriptionsLongues: topDescriptions,
        repartitionParStatut: statsByStatus
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'agrégation des statistiques',
      error: error.message
    });
  }
});

export default router;