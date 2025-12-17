const express = require('express');
const Event = require('../models/Event');
const validator = require('validator');

const router = express.Router();

router.get('/:id/title', async (req, res) => {
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

    res.status(200).json({
      success: true,
      data: {
        id: event.id,
        title: event.title
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du titre',
      error: error.message
    });
  }
});

