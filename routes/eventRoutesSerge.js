const express = require('express');
const Compte = require('../models/Compte');
const Event = require('../models/Event');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const router = express.Router();

// ============================================================================
// ROUTE 1: Récupère les événements par participant
// ============================================================================
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

    const { metadata, data } = aggregation[0];
    const total = metadata[0]?.total || 0;

    return res.status(200).json({
      success: true,
      total,
      skip: skipNum,
      limit: limitNum,
      data
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// ROUTE 2: Récupère les événements par organisateur
// ============================================================================
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

    const { metadata, data } = aggregation[0];
    const total = metadata[0]?.total || 0;

    return res.status(200).json({
      success: true,
      total,
      skip: skipNum,
      limit: limitNum,
      data
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// ROUTE 3: Mettre à jour le nom d'utilisateur
// ============================================================================
router.put('/:id/username', async (req, res) => {
  try {
    const { id } = req.params;
    const { newUsername, password } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "ID invalide" });
    }

    const user = await Compte.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Mot de passe incorrect, modification refusée." });
    }

    if (newUsername !== user.username) {
      const existingUser = await Compte.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Ce nom d'utilisateur est déjà pris." });
      }
    }

    user.username = newUsername;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Nom d'utilisateur mis à jour avec succès",
      data: { username: user.username }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// ROUTE 4: Mettre à jour le mot de passe
// ============================================================================
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await Compte.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "L'ancien mot de passe est incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mot de passe modifié avec succès."
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// ROUTE 5: Vérifier l'existence d'un nom d'utilisateur
// ============================================================================
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    const user = await Compte.findOne({ username: username });

    if (user) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: "Ce nom d'utilisateur est déjà utilisé."
      });
    } else {
      return res.status(200).json({
        success: true,
        exists: false,
        message: "Ce nom d'utilisateur est disponible."
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
