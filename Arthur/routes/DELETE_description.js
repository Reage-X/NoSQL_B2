//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();

/**
* ROUTE 3 - DELETE : Supprimer la description d'un événement (la vider)
 * Endpoint: DELETE /api/events/:id/description
 * Note: Cette route vide la description au lieu de supprimer l'événement entier
 */
router.delete('/:id/description', async (req, res) => {
  try {
    const { id } = req.params;

    //validation ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'événement invalide'
      });
    }

    //verif si l'event existe
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    //vider description
    event.description = 'Description non disponible';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Description supprimée avec succès',
      data: {
        id: event._id,
        title: event.title,
        description: event.description
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la description',
      error: error.message
    });
  }
});

export default router;