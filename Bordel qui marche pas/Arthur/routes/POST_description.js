//routes/eventRoutes.js
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

    //validation de ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'événement invalide'
      });
    }

    //validation description
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

    //verif si evenement existe
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

export default router;