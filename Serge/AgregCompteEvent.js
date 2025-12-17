// routes/agregCompteevent.js
const express = require('express');
const Event = require('../models/Event');
const Compte = require('../models/Compte');
const mongoose = require('mongoose');

const router = express.Router();

/*
  Récupère les 10 premiers événements correspondant au nom du participant recherché
  Permet la pagination optimisée: les 10 prochains sont récupérés sans refaire
  une requête pour tous les événements déjà affichés
*/

router.get('/by-participant/:participantName', async (req, res) => {
  try {
    const { participantName } = req.params;
    const { skip = 0, limit = 10 } = req.query;

    // Validation des paramètres
    if (!participantName || participantName.trim() === '') {
      return res.status(400).json({
        error: 'Le nom du participant est requis',
        exemple: '/api/events/by-participant/Jean?skip=0&limit=10'
      });
    }

    const skipNum = Math.max(0, parseInt(skip) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 pour éviter les surcharges

    const aggregation = await Event.aggregate([
      // Filtrage des événements
      {
        $match: {
          participantsId: {
            $exists: true,
            $not: { $size: 0 }
          }
        }
      },

      {
        $lookup: {
          from: 'comptes',
          localField: 'participantsId',
          foreignField: '_id',
          as: 'participants'
        }
      },

      // On verifie que le participant recherché est bien dans la liste
      {
        $match: {
          'participants.username': {
            $regex: participantName,
            $options: 'i'
          }
        }
      },
      {
        $sort: {
          startDate: 1
        }
      },

        // Pagination
      {
        $facet: {
          metadata: [
            {
              $count: 'total'
            }
          ],
          data: [
            // Pagination
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
                organisateurId: { $toString: '$organisateurId' },
                participants: {
                  $map: {
                    input: '$participants',
                    as: 'participant',
                    in: {
                      id: { $toString: '$$participant._id' },
                      username: '$$participant.username',
                      email: '$$participant.email'
                    }
                  }
                },
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
        nextSkip: skipNum + limitNum 
      },
      evenements: data,
      message: data.length > 0 
        ? `${data.length} événement(s) trouvé(s) pour le participant "${participantName}"`
        : `Aucun événement trouvé pour le participant "${participantName}"`
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
