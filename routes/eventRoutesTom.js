import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';
import { saveStatsToJson, readInitialData } from '../utils/fileHandler.js';

const router = express.Router();

/**
 * 1. POST - Création d'un événement (Route d'écriture)
 * Test : POST http://localhost:5000/api/events/
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, date, creatorId } = req.body;

    // Validation des données (Exigence n°5)
    if (!title || !date || !creatorId) {
      return res.status(400).json({ success: false, message: "Champs obligatoires manquants (title, date, creatorId)" });
    }

    if (!validator.isMongoId(creatorId)) {
      return res.status(400).json({ success: false, message: "ID créateur invalide." });
    }

    const newEvent = await Event.create({
      title: title.trim(),
      description,
      date: new Date(date),
      creator: creatorId,
      popularity: Math.floor(Math.random() * 100) // Popularité aléatoire pour tester le Top 5
    });

    res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. GET - Recherche avancée & Pagination (Route de lecture)
 * Test : GET http://localhost:5000/api/events/search?keyword=Tech&page=1&limit=5
 */
router.get('/search', async (req, res) => {
  try {
    const { keyword, page = 1, limit = 5 } = req.query;
    
    // Filtre de recherche par titre (Regex insensible à la casse)
    const filter = keyword ? { title: { $regex: keyword, $options: 'i' } } : {};

    const queryLimit = parseInt(limit);
    const skip = (parseInt(page) - 1) * queryLimit;

    const events = await Event.find(filter)
      .skip(skip)
      .limit(queryLimit)
      .sort({ date: 1 });

    const totalEvents = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Résultats de la recherche avec pagination.',
      data: events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEvents / queryLimit),
        totalEvents: totalEvents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. GET - Agrégation Top 5 & Écriture JSON (Route d'agrégation)
 * Test : GET http://localhost:5000/api/events/top5
 */
router.get('/top5', async (req, res) => {
  try {
    const top5Pipeline = [
      { $sort: { popularity: -1 } },
      { $limit: 5 },
      {
        $lookup: { // Jointure entre collections (Exigence n°5)
          from: 'comptes', // nom de la collection dans MongoDB
          localField: 'creator',
          foreignField: '_id',
          as: 'organizerInfo'
        }
      },
      {
        $project: {
          _id: 0,
          title: 1,
          popularity: 1,
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          organizer: { $arrayElemAt: ["$organizerInfo.username", 0] }
        }
      }
    ];

    const topEvents = await Event.aggregate(top5Pipeline);

    // --- MANIPULATION FICHIER : ÉCRITURE (Exigence n°4) ---
    saveStatsToJson(topEvents);

    res.status(200).json({
      success: true,
      message: 'Top 5 exporté dans /data/top_events.json',
      data: topEvents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de l\'agrégation', error: error.message });
  }
});

/**
 * 4. POST - Lecture JSON initial (Exigence n°4 - Manipulation de fichiers)
 * Test : POST http://localhost:5000/api/events/import
 */
router.post('/import', async (req, res) => {
    try {
        const data = readInitialData('initial_data.json');
        
        if (!data) {
            return res.status(404).json({ success: false, message: "Fichier /data/initial_data.json non trouvé" });
        }

        res.status(200).json({
            success: true,
            message: "Fichier JSON lu avec succès",
            count: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;