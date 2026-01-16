import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers JSON
const jsonPath = path.join(__dirname, '../../stock_parsed.json');

function loadGames() {
  try {
    const data = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading stock_parsed.json:', err.message);
    return [];
  }
}

export default function routes(app) {
  app.get('/games', (req, res) => {
    try {
      const games = loadGames();
      res.json(games);
    } catch (err) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  });

  app.get('/games/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id))
        return res.status(400).json({ error: 'INVALID_ID' });

      const games = loadGames();
      const game = games.find((g) => g.id === id);

      if (!game) return res.status(404).json({ error: 'NOT_FOUND' });
      res.json(game);
    } catch (err) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  });

  // POST route to add a new game
  app.post('/games', (req, res) => {
    try {
      const games = loadGames();
      const newGame = {
        id: games.length > 0 ? Math.max(...games.map((g) => g.id)) + 1 : 1,
        ...req.body,
      };
      games.push(newGame);
      fs.writeFileSync(jsonPath, JSON.stringify(games, null, 2), 'utf-8');
      res.status(201).json(newGame);
    } catch (err) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  });

  // POST route to import CSV and replace JSON DB
  app.post('/import-csv', (req, res) => {
    try {
      const { csvContent } = req.body;
      if (!csvContent) {
        return res
          .status(400)
          .json({ error: 'CSV_REQUIRED', message: 'csvContent manquant' });
      }

      // Parse CSV to JSON
      const lines = csvContent.trim().split(/\r?\n/);
      if (lines.length < 2) {
        return res
          .status(400)
          .json({ error: 'INVALID_CSV', message: 'CSV vide ou invalide' });
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const games = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const game = {};

        headers.forEach((header, index) => {
          const value = values[index] || '';
          // Convert numbers
          if (
            header === 'id' ||
            header === 'annee_sortie' ||
            header === 'valeur_estimee' ||
            header === 'prix_achat'
          ) {
            game[header] = Number(value) || 0;
          } else {
            game[header] = value;
          }
        });

        // Skip if empty or emplacement is 'poubelle'
        if (game.titre_jeu && game.emplacement?.toLowerCase() !== 'poubelle') {
          games.push(game);
        }
      }

      // Replace JSON file
      fs.writeFileSync(jsonPath, JSON.stringify(games, null, 2), 'utf-8');
      res.json({
        success: true,
        count: games.length,
        message: `${games.length} jeux importés`,
      });
    } catch (err) {
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
  });
}
