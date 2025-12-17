import express from 'express';
import Event from '../models/Event.js'; 
import validator from 'validator'; 

const router = express.Router();

// Route Post
router.post('/', async (req, res) => {
    try {
        const { title, description, date, creatorId } = req.body;

        //Validation de base
        if (!title || !description || !date || !creatorId) {
            return res.status(400).json({ success: false, message: 'Données manquantes : Titre, description, date et créateur sont requis.' });
        }
        if (!validator.isMongoId(creatorId)) {
            return res.status(400).json({ success: false, message: "ID créateur invalide." });
        }

        // creation d'event
        const newEvent = await Event.create({
            title: title.trim(),
            description: description.trim(),
            date: new Date(date),
            creator: creatorId,
            popularity: 0 // init a 0
        });

        res.status(201).json({
            success: true,
            message: 'Événement créé avec succès.',
            data: newEvent
        });

    } catch (error) {
        // Gestion des erreurs serveur ou Mongoose
        res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'événement', error: error.message });
    }
});
