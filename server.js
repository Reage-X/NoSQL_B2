import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Imports des routes de chaque membre
import eventRoutesTom from './routes/eventRoutesTom.js';
import eventRoutesAssetou from './routes/eventRoutesAssetou.js';
import eventRoutesSerge from './routes/eventRoutesSerge.js';
import eventRoutesArthur from './routes/eventRoutesArthur.js';
import eventRoutesAziz from './routes/eventRoutesAziz.js';
import eventRoutesNicolas from './routes/eventRoutesNicolas.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Attribution des routes par membre
app.use('/api/events/tom', eventRoutesTom);
app.use('/api/events/assetou', eventRoutesAssetou);
app.use('/api/events/serge', eventRoutesSerge);
app.use('/api/events/arthur', eventRoutesArthur);
app.use('/api/events/aziz', eventRoutesAziz);
app.use('/api/events/nicolas', eventRoutesNicolas);

app.get('/', (req, res) => {
    res.send("🚀 API NoSQL Skills4Mind opérationnelle ! Tous les membres sont connectés.");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`---`);
    console.log(`🚀 SERVEUR GROUPE DÉMARRÉ : http://localhost:${PORT}`);
    console.log(`📡 TESTER LES ROUTES PAR PRÉNOM (ex: /api/events/tom)`);
    console.log(`---`);
});