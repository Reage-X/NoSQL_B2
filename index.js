const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// ============================================================================
// ROUTES ARTHUR - Agrégations et descriptions d'événements
// ============================================================================
const arthurAgreg = require('./Arthur/routes/agreg_MongoDB');
const arthurGetDesc = require('./Arthur/routes/GET_description');
const arthurPostDesc = require('./Arthur/routes/POST_description');

app.use('/api/events/agreg', arthurAgreg);
app.use('/api/events/desc', arthurGetDesc);
app.use('/api/events/desc', arthurPostDesc);

// ============================================================================
// ROUTES AZIZ - Événements, incidents, services
// ============================================================================
const azizEventsRoutes = require('./Aziz/routes/events.routes');
const azizIncidentsRoutes = require('./Aziz/routes/incidents.routes');
const azizServicesRoutes = require('./Aziz/routes/services.routes');

app.use('/api/events', azizEventsRoutes);
app.use('/api/incidents', azizIncidentsRoutes);
app.use('/api/services', azizServicesRoutes);

// ============================================================================
// ROUTES TOM - Agrégations et opérations GET/POST
// ============================================================================
const RoutesAgreg = require('./Tom/RoutesAgreg');
const RoutesGET = require('./Tom/RoutesGET');
const RoutesPOST = require('./Tom/RoutesPOST');

app.use('/api/tom/agreg', RoutesAgreg);
app.use('/api/tom/get', RoutesGET);
app.use('/api/tom/post', RoutesPOST);
// ============================================================================
// ROUTES SERGE - Opérations utilisateur et agrégations
// ============================================================================
const AgregCompteEvent = require('./Serge/AgregCompteEvent');
const AgregOrgaEvent = require('./Serge/AgregOrgaEvent');
const UpdateUserName = require('./Serge/UpdateUserName');
const UpdateUserPassword = require('./Serge/UpdateUserPassword');
const UserNameExist = require('./Serge/UserNameExist');

app.use('/api/events', AgregCompteEvent);
app.use('/api/events', AgregOrgaEvent);
app.use('/api/user/name', UpdateUserName);
app.use('/api/user/password', UpdateUserPassword);
app.use('/api/user/check', UserNameExist);

// ============================================================================
// ROUTES NICO - Opérations CRUD
// ============================================================================
const nicoDelete = require('./Nico/del');
const nicoEdit = require('./Nico/edit');
const nicoGet = require('./Nico/get');

app.use('/api/nico/delete', nicoDelete);
app.use('/api/nico/edit', nicoEdit);
app.use('/api/nico/get', nicoGet);


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


