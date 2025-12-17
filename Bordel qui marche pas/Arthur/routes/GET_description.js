//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();

/**
 * ROUTE 2 - GET : Récupérer les descriptions des événements avec filtres avancés
 * Endpoint: GET /api/events/descriptions
 * Query params: 
 *   - search: recherche textuelle dans les descriptions
 *   - category: filtrer par catégorie
 *   - status: filtrer par statut
 *   - minLength: longueur minimale de la description
 *   - page: numéro de page (défaut: 1)
 *   - limit: nombre d'éléments par page (défaut: 10)
 *   - sortBy: tri par date (newest/oldest)
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

    //requete projection optimisée
    const events = await Event.find(filter)
      .select('title description date location category status organizer')
      .sort({ date: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    //comptage total pour la pagination
    const total = await Event.countDocuments(filter);

    //ajouter longueur de chaque description
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

export default router;