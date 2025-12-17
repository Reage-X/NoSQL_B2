//* Route aggregation
//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';

const router = express.Router();

router.get('/titles/sorted', async (req, res) => {
  try {
    const titles = await Event.aggregate([
    
      {
        $match: {
          title: { $exists: true, $ne: '' }
        }
      },
     
      {
        $project: {
          _id: 0,
          title: 1
        }
      },
   
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



//*Route delete
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
        id: event.id,
        title: event.title
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
});

export default router;



//*Route Edit
router.patch('/:id/title', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID d'événement invalide"
      });
    }

    if (!title || typeof title !== 'string' || validator.isEmpty(title.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis et ne peut pas être vide'
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    event.title = title.trim();
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Titre modifié avec succès',
      data: {
        id: event.id,
        title: event.title
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





//*Route get
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
