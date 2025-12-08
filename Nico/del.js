//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();


router.delete('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID d'événement invalide"
      });
    }

    
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

 
    event.title = 'Titre non disponible';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Titre supprimé avec succès',
      data: {
        id: event._id,
        title: event.title,
        description: event.description
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du titre',
      error: error.message
    });
  }
});

export default router;
