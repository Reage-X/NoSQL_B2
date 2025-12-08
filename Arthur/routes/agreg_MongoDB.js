//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();

/**
 * ROUTE 3 - GET : Agrégation MongoDB - Statistiques sur les descriptions
 * Endpoint: GET /api/events/descriptions/stats
 * Pipeline d'agrégation pour analyser les descriptions des événements
 * Retourne:
 *   - Statistiques par catégorie (nombre d'événements, longueur moyenne/min/max des descriptions)
 *   - Top 5 des événements avec les descriptions les plus longues
 *   - Répartition par statut avec moyennes
 */

router.get('/descriptions/stats', async (req, res) => {
  try {
    //pipeline agrégation MongoDB
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

    //top 5 des descriptions les plus longues
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

    //repartition par statut
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