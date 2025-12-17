const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// ============================================================================
// ROUTES ARTHUR - Agrégations et descriptions d'événements
// ============================================================================
const ArthurRoutes = require('./routes/eventRoutesArthur');

app.use('/api', ArthurRoutes);

// ============================================================================
// ROUTES AZIZ - Événements, incidents, services
// ============================================================================
const AzizRoutes = require('./routes/eventRoutesAziz');

app.use('/api', AzizRoutes);

// ============================================================================
// ROUTES TOM - Agrégations et opérations GET/POST
// ============================================================================
const TomRoutes = require('./routes/eventRoutesTom');

app.use('/api', TomRoutes);
// ============================================================================
// ROUTES SERGE - Opérations utilisateur et agrégations
// ============================================================================
const SergeRoutes = require('./routes/eventRoutesSerge');

app.use('/api', SergeRoutes);

// ============================================================================
// ROUTES NICO - Opérations CRUD
// ============================================================================
const NicoRoutes = require('./routes/eventRoutesNico');

app.use('/api', NicoRoutes);


// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({
    error: 'Erreur serveur',
    message: err.message
  });
});

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log('📚 Documentation des routes disponible sur GET /');
});

module.exports = app;


