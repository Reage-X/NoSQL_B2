//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';

const router = express.Router();

/**
 * ROUTE - GET (AGGREGATION) : Récupérer les titres des événements triés par ordre alphabétique
 * Endpoint: GET /api/events/titles/sorted
 */
router.get('/titles/sorted', async (req, res) => {
  try {
    const titles = await Event.aggregate([
      // Exclure les événements sans titre ou avec titre vide
      {
        $match: {
          title: { $exists: true, $ne: '' }
        }
      },
      // Ne garder que le champ title
      {
        $project: {
          _id: 0,
          title: 1
        }
      },
      // Trier par ordre alphabétique (A → Z)
      {
        $sort: {
          title: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Titres triés par ordre alphabétique',
      count: titles.length,
      data: titles
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du tri des titres',
      error: error.message
    });
  }
});

export default router;
