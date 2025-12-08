//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();

/**
 * ROUTE 2 - PUT : Mettre à jour la description d'un événement
 * Endpoint: PUT /api/events/:id/description
 * Body: { description: "nouvelle description" }
 */
router.put('/:id/description', async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    // Validation de l'ID
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

    //maj
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { description: description.trim() },
      { 
        new: true, // Retourner le document mis à jour
        runValidators: true // Exécuter les validateurs du schéma
      }
    ).select('title description updatedAt');

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Description mise à jour avec succès',
      data: updatedEvent
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