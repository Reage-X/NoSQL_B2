import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();

/**
 * 1. GET - Titres triés par ordre alphabétique (Agrégation)
 * Test : GET http://localhost:5000/api/events/nicolas/titles/sorted
 */
router.get('/titles/sorted', async (req, res) => {
  try {
    const titles = await Event.aggregate([
      {
        $match: { title: { $exists: true, $ne: '' } }
      },
      {
        $project: { _id: 0, title: 1 }
      },
      {
        $sort: { title: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Titres triés par ordre alphabétique',
      count: titles.length,
      data: titles
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors du tri des titres', error: error.message });
  }
});

/**
 * 2. GET - Récupération d'un titre par ID
 * Test : GET http://localhost:5000/api/events/nicolas/:id/title
 */
router.get('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({ success: false, message: "ID d'événement invalide" });
    }

    const event = await Event.findById(id).select('title');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    res.status(200).json({
      success: true,
      data: { id: event.id, title: event.title }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. PATCH - Modification d'un titre
 * Test : PATCH http://localhost:5000/api/events/nicolas/:id/title
 */
router.patch('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({ success: false, message: "ID d'événement invalide" });
    }

    if (!title || validator.isEmpty(title.trim())) {
      return res.status(400).json({ success: false, message: 'Le titre est requis et ne peut pas être vide' });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    event.title = title.trim();
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Titre modifié avec succès',
      data: { id: event.id, title: event.title }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. DELETE - "Suppression" du titre (Reset par défaut)
 * Test : DELETE http://localhost:5000/api/events/nicolas/:id/title
 */
router.delete('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({ success: false, message: "ID d'événement invalide" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }
    
    event.title = 'Titre non disponible';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Titre réinitialisé avec succès',
      data: { id: event.id, title: event.title }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;