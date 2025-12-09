// Route Agreg
router.get('/top5', async (req, res) => {
    try {
        const top5Pipeline = [
            // Tri par popularite decroissant
            { $sort: { popularity: -1 } },
            
            // Limite 5 premier
            { $limit: 5 },
            //projection
            {
                $project: {
                    _id: 0,//id exclu de mongo
                    title: 1,
                    description: 1,
                    popularity: 1,
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
                }
            }
        ];
        //pipeline d'agreg
        const topEvents = await Event.aggregate(top5Pipeline);

        res.status(200).json({
            success: true,
            message: 'Top 5 des événements les plus populaires.',
            data: topEvents
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de l\'agrégation Top 5.', error: error.message });
    }
});