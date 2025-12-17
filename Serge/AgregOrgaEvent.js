// routes/AgregOrgaEvent.js
const express = require('express');
const Event = require('../models/Event');
const Compte = require('../models/Compte');
const mongoose = require('mongoose');

const router = express.Router();


router.get('/by-organizer/:organizerName', async (req, res) => {
  try {
    const { organizerName } = req.params;
    const { skip = 0, limit = 10 } = req.query;

    // Validation des paramètres
    if (!organizerName || organizerName.trim() === '') {
      return res.status(400).json({
        error: 'Le nom de l\'organisateur est requis',
        exemple: '/api/events/by-organizer/Marie?skip=0&limit=10'
      });
    }

    const skipNum = Math.max(0, parseInt(skip) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 pour éviter les surcharges

    // Agrégation MongoDB optimisée
    const aggregation = await Event.aggregate([
      // Étape 1: Lookup pour récupérer les infos de l'organisateur
      {
        $lookup: {
          from: 'comptes', // Collection 'Compte'
          localField: 'organisateurId',
          foreignField: '_id',
          as: 'organisateur'
        }
      },

      // Étape 2: Filtrer les événements où l'organisateur correspond au nom recherché
      {
        $match: {
          'organisateur.username': {
            $regex: organizerName,
            $options: 'i' // Case insensitive
          }
        }
      },

      // Étape 3: Tri par date de début (plus proches d'abord)
      {
        $sort: {
          startDate: 1
        }
      },

      // Étape 4: Compter le nombre total AVANT la pagination
      // On utilise facet pour garder les stats et les données
      {
        $facet: {
          metadata: [
            {
              $count: 'total'
            }
          ],
          data: [
            // Pagination optimisée: skip puis limit
            {
              $skip: skipNum
            },
            {
              $limit: limitNum
            },
            // Formatage des résultats
            {
              $project: {
                id: { $toString: '$_id' },
                title: 1,
                description: 1,
                url: 1,
                startDate: 1,
                endDate: 1,
                location: 1,
                populate: 1,
                organisateur: {
                  $cond: [
                    { $gt: [{ $size: '$organisateur' }, 0] },
                    {
                      id: { $toString: { $arrayElemAt: ['$organisateur._id', 0] } },
                      username: { $arrayElemAt: ['$organisateur.username', 0] },
                      email: { $arrayElemAt: ['$organisateur.email', 0] }
                    },
                    { id: 'unknown', username: 'Inconnu', email: 'N/A' }
                  ]
                },
                participantsCount: { $size: '$participantsId' },
                _id: 0
              }
            }
          ]
        }
      }
    ]);

    // Extraire les résultats
    const metadata = aggregation[0].metadata;
    const data = aggregation[0].data;

    const total = metadata.length > 0 ? metadata[0].total : 0;

    // Réponse avec infos de pagination
    res.json({
      pagination: {
        total: total,
        skip: skipNum,
        limit: limitNum,
        hasMore: skipNum + limitNum < total,
        nextSkip: skipNum + limitNum // Pour faciliter le chargement des 10 suivants
      },
      evenements: data,
      message: data.length > 0 
        ? `${data.length} événement(s) organisé(s) par "${organizerName}"`
        : `Aucun événement organisé par "${organizerName}"`
    });

  } catch (error) {
    console.error('Erreur lors de l\'agrégation:', error);
    res.status(500).json({
      error: 'Erreur lors de la recherche des événements',
      details: error.message
    });
  }
});

module.exports = router;