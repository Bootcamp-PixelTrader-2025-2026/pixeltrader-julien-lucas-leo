import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from front folder
app.use(express.static(path.join(__dirname, 'front')));

routes(app);

// Route de base - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'index.html'));
});

//Exemple
app.get('/user', (req, res) => {
  res.send('Got a GET request at /user');
});

// Semarrage du serveur
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
