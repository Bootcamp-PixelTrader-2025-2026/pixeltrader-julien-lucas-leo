import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/game.js';
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// // ✅ Chemin exact de ton dossier d'images
// const assetsFolder = path.join(__dirname, 'src/assets/game_images');

// // Crée le dossier s'il n'existe pas
// if (!fs.existsSync(assetsFolder)) {
//   fs.mkdirSync(assetsFolder, { recursive: true });
// }

// // Multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     console.log('Saving file to:', assetsFolder);
//     cb(null, assetsFolder);
//   },
//   filename: (req, file, cb) => {
//     console.log('File original name:', file.originalname);
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage });
// // Upload endpoint
// app.post('/import-image', upload.single('image'), (req, res) => {
//   try {
//     console.log('Received file object:', req.file);
//     if (!req.file) {
//       console.log('No file received!');
//       return res.status(400).send('Aucun fichier reçu');
//     }
//     res.send('Image importée avec succès !');
//   } catch (err) {
//     console.error('Erreur serveur:', err);
//     res.status(500).send('Erreur serveur lors de l\'upload');
//   }
// });
// // Servir les images via /assets
// app.use('/assets', express.static(assetsFolder));

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
