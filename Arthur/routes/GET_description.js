//routes/eventRoutes.js
import express from 'express';
import Event from '../models/Event.js';
import validator from 'validator';

const router = express.Router();

/**
 * ROUTE 1 - GET : Récupérer les descriptions des événements avec filtres avancés
 * Endpoint: GET /api/events/descriptions
 * Query params: 
 *   - search: recherche textuelle dans les descriptions
 *   - category: filtrer par catégorie
 *   - status: filtrer par statut
 *   - page: numéro de page (défaut: 1)
 *   - limit: nombre d'éléments par page (défaut: 10)
 *   - sortBy: tri par date (newest/oldest)
 */
router.get('/descriptions', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      status, 
      page = 1, 
      limit = 10,
      sortBy = 'newest'
    } = req.query;

    //construction filtre
    const filter = {};
    
    if (search && !validator.isEmpty(search.trim())) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    }

    //pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sortBy === 'oldest' ? 1 : -1;

    //requete projection pour optimiser
    const events = await Event.find(filter)
      .select('title description date location category status organizer')
      .sort({ date: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    //comptage total pour la pagination
    const total = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        eventsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des descriptions',
      error: error.message
    });
  }
});

export default router;