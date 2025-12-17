// Route Get

router.get('/search', async (req, res) => {
    try {
        const { keyword, page = 1, limit = 10 } = req.query;

        const queryLimit = parseInt(limit);
        const skip = (parseInt(page) - 1) * queryLimit;
        const filter = {};
        
        // filtre de recherche
        if (keyword) {
            const regex = new RegExp(keyword, 'i'); 
            filter.$or = [
                { title: { $regex: regex } },
                { description: { $regex: regex } }
            ];
        }

        // recup des donnes 
        const events = await Event.find(filter)
            .select('title date popularity')
            .sort({ date: -1 })
            .skip(skip)
            .limit(queryLimit)
            .lean();

        // Comptage totale des pages
        const totalEvents = await Event.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Résultats de la recherche avec pagination.',
            data: events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalEvents / queryLimit),
                totalEvents: totalEvents
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la recherche des événements.', error: error.message });
    }
});
