// import sql from './db.js'

// const fs = require('fs');
// const path = require('path');

// // JSON is in the root folder
// const filePath = path.join(__dirname, '../../stock_parsed.json'); 

// // Read and parse the JSON
// const rawData = fs.readFileSync(filePath, 'utf-8');
// const games = JSON.parse(rawData);

// console.log('Loaded', games.length, 'games');;

// // Extract unique foreign keys
// const plateformes = [...new Set(games.map(g => g.plateforme))];
// const emplacements = [...new Set(games.map(g => g.emplacement))];

// // Generate SQL for foreign tables
// let sql = '-- Insert plateformes\n';
// plateformes.forEach((plateforme, index) => {
//   sql += `INSERT INTO plateforme (id, nom) VALUES (${index + 1}, '${plateforme.replace("'", "''")}') ON CONFLICT (id) DO NOTHING;\n`;
// });

// sql += '\n-- Insert emplacements\n';
// emplacements.forEach((emplacement, index) => {
//   sql += `INSERT INTO emplacement (id, nom) VALUES (${index + 1}, '${emplacement.replace("'", "''")}') ON CONFLICT (id) DO NOTHING;\n`;
// });

// // Create a map from name to id for foreign key reference
// const plateformeMap = Object.fromEntries(plateformes.map((p, i) => [p, i + 1]));
// const emplacementMap = Object.fromEntries(emplacements.map((e, i) => [e, i + 1]));

// // Generate SQL for jeux table
// sql += '\n-- Insert jeux\n';
// games.forEach(game => {
//   sql += `
// INSERT INTO jeux (id, titre_jeu, plateforme_id, annee_sortie, etat, emplacement_id, valeureestimee, prix_achat)
// VALUES (
//   ${game.id},
//   '${game.titre_jeu.replace("'", "''")}',
//   ${plateformeMap[game.plateforme]},
//   ${game.annee_sortie},
//   '${game.etat.replace("'", "''")}',
//   ${emplacementMap[game.emplacement]},
//   ${game.valeureestimee},
//   ${game.prix_achat}
// )
// ON CONFLICT (id) DO NOTHING;
// `;
// });

// // Save SQL file
// fs.writeFileSync('insert_all_games.sql', sql);
// console.log('SQL file created: insert_all_games.sql');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../../stock_parsed.json');
const games = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`Loaded ${games.length} games`);

// Path to your images folder
const assetsPath = path.join(__dirname, '../assets');

function findImage(gameTitle) {
  const normalized = gameTitle.replace(/\s+/g, '_').toLowerCase();
  const files = fs.readdirSync(assetsPath);
  const found = files.find(f => f.toLowerCase().startsWith(normalized));
  return found ? path.join('assets', found) : null;
}

try {
  await sql.begin(async tx => {

    const plateformeMap = {};
    const emplacementMap = {};
    const etatMap = {};

    // ---- Insert unique Plateformes, Emplacements, Etats ----
    for (const g of games) {
      if (!plateformeMap[g.plateforme]) {
        const plateformeRow = await tx`
          INSERT INTO Plateforme (nom)
          VALUES (${g.plateforme})
          ON CONFLICT (nom) DO NOTHING
          RETURNING idPlateforme
        `;
        // If the row already exists, select it
        const id = plateformeRow[0]?.idPlateforme ?? (await tx`SELECT idPlateforme FROM Plateforme WHERE nom=${g.plateforme}`)[0].idPlateforme;
        plateformeMap[g.plateforme] = id;
      }

      if (!emplacementMap[g.emplacement]) {
        const emplacementRow = await tx`
          INSERT INTO Emplacement (nom)
          VALUES (${g.emplacement})
          ON CONFLICT (nom) DO NOTHING
          RETURNING idEmplacement
        `;
        const id = emplacementRow[0]?.idEmplacement ?? (await tx`SELECT idEmplacement FROM Emplacement WHERE nom=${g.emplacement}`)[0].idEmplacement;
        emplacementMap[g.emplacement] = id;
      }

      if (!etatMap[g.etat]) {
        const etatRow = await tx`
          INSERT INTO Etat (nom)
          VALUES (${g.etat})
          ON CONFLICT (nom) DO NOTHING
          RETURNING idEtat
        `;
        const id = etatRow[0]?.idEtat ?? (await tx`SELECT idEtat FROM Etat WHERE nom=${g.etat}`)[0].idEtat;
        etatMap[g.etat] = id;
      }
    }

    // ---- Insert Prix ----
    const prixMap = new Map();
    for (const g of games) {
      const prixRow = await tx`
        INSERT INTO Prix (valeur_estimee)
        VALUES (${g.valeur_estimee})
        RETURNING idPrix
      `;
      prixMap.set(g.titre_jeu + g.plateforme + g.annee_sortie, prixRow[0].idPrix);
    }

    // ---- Insert Jeux with image ----
    const jeuxMap = new Map();
    for (const g of games) {
      const idPrix = prixMap.get(g.titre_jeu + g.plateforme + g.annee_sortie);
      const imagePath = findImage(g.titre_jeu);

      const jeuRow = await tx`
        INSERT INTO Jeux (titre, idPlatforme, anneesortie, idEtat, idEmplacement, idPrix, image)
        VALUES (
          ${g.titre_jeu},
          ${plateformeMap[g.plateforme]},
          ${g.annee_sortie},
          ${etatMap[g.etat]},
          ${emplacementMap[g.emplacement]},
          ${idPrix},
          ${imagePath}
        )
        RETURNING idJeu
      `;
      jeuxMap.set(g.titre_jeu + g.plateforme + g.annee_sortie, jeuRow[0].idJeu);
    }

    // ---- Insert Stock ----
    for (const g of games) {
      const idPrix = prixMap.get(g.titre_jeu + g.plateforme + g.annee_sortie);
      const idJeu = jeuxMap.get(g.titre_jeu + g.plateforme + g.annee_sortie);
      await tx`
        INSERT INTO Stock (idJeu, disponibilité, prixAchat, idPrix)
        VALUES (
          ${idJeu},
          ${g.quantite ?? 1},
          ${g.prix_achat},
          ${idPrix}
        )
      `;
    }

  });

  console.log('✅ Import terminé avec images et IDs auto-incrémentés');

} catch (err) {
  console.error('❌ Erreur import:', err);
}
