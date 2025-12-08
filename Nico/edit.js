//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();

/**
 * ROUTE - PATCH : Modifier le titre d'un événement
 * Endpoint: PATCH /api/events/:id/title
 */
router.patch('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // Validation de l'ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID d'événement invalide"
      });
    }

    // Validation du titre
    if (!title || typeof title !== "string" || validator.isEmpty(title.trim())) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau titre est requis et ne peut pas être vide"
      });
    }

    // Vérifier si l'événement existe
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Modifier le titre
    event.title = title.trim();
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Titre modifié avec succès',
      data: {
        id: event._id,
        title: event.title,
        description: event.description
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du titre',
      error: error.message
    });
  }
});

export default router;
