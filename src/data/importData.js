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
// const platformes = [...new Set(games.map(g => g.platforme))];
// const emplacements = [...new Set(games.map(g => g.emplacement))];

// // Generate SQL for foreign tables
// let sql = '-- Insert platformes\n';
// platformes.forEach((platforme, index) => {
//   sql += `INSERT INTO platforme (id, nom) VALUES (${index + 1}, '${platforme.replace("'", "''")}') ON CONFLICT (id) DO NOTHING;\n`;
// });

// sql += '\n-- Insert emplacements\n';
// emplacements.forEach((emplacement, index) => {
//   sql += `INSERT INTO emplacement (id, nom) VALUES (${index + 1}, '${emplacement.replace("'", "''")}') ON CONFLICT (id) DO NOTHING;\n`;
// });

// // Create a map from name to id for foreign key reference
// const platformeMap = Object.fromEntries(platformes.map((p, i) => [p, i + 1]));
// const emplacementMap = Object.fromEntries(emplacements.map((e, i) => [e, i + 1]));

// // Generate SQL for jeux table
// sql += '\n-- Insert jeux\n';
// games.forEach(game => {
//   sql += `
// INSERT INTO jeux (id, titre_jeu, platforme_id, anneesortie, etat, emplacement_id, valeureestimee, prix_achat)
// VALUES (
//   ${game.id},
//   '${game.titre_jeu.replace("'", "''")}',
//   ${platformeMap[game.platforme]},
//   ${game.anneesortie},
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
import sql from './db.js'; // your postgres client

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON file
const jsonPath = path.join(__dirname, '../../stock_parsed.json');
const games = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`Loaded ${games.length} games`);

// Path to images folder
const assetsPath = path.join(__dirname, '../assets');

// Helper to find image
function findImage(titreJeu) {
  if (!titreJeu) return null;
  const normalized = titreJeu.replace(/\s+/g, '_').toLowerCase();
  const files = fs.readdirSync(assetsPath);
  const found = files.find(f => f.toLowerCase().startsWith(normalized));
  return found ? path.join('assets', found) : null;
}

try {
  await sql.begin(async tx => {

    // --- Maps to store IDs ---
    const platformeIdMap = {};
    const emplacementIdMap = {};
    const etatIdMap = {};

    // --- Insert default "Unknown" entries ---
    const defaultPlatformeRow = await tx`
      INSERT INTO plateforme (nom)
      VALUES ('Unknown')
      ON CONFLICT (nom) DO NOTHING
      RETURNING idplateforme
    `;
    platformeIdMap['Unknown'] = defaultPlatformeRow[0]?.idplateforme
      ?? (await tx`SELECT idplateforme FROM plateforme WHERE nom='Unknown'`)[0].idplateforme;

    const defaultEtatRow = await tx`
      INSERT INTO etat (nom)
      VALUES ('Unknown')
      ON CONFLICT (nom) DO NOTHING
      RETURNING idetat
    `;
    etatIdMap['Unknown'] = defaultEtatRow[0]?.idetat
      ?? (await tx`SELECT idetat FROM etat WHERE nom='Unknown'`)[0].idetat;

    const defaultEmplacementRow = await tx`
      INSERT INTO emplacement (nom)
      VALUES ('Unknown')
      ON CONFLICT (nom) DO NOTHING
      RETURNING idemplacement
    `;
    emplacementIdMap['Unknown'] = defaultEmplacementRow[0]?.idemplacement
      ?? (await tx`SELECT idemplacement FROM emplacement WHERE nom='Unknown'`)[0].idemplacement;

    // ---- Now loop over your JSON and insert plateformes, emplacements, etats ----
    for (const g of games) {
      // Plateforme
      if (!platformeIdMap[g.plateforme] && g.plateforme) {
        const plateformeRow = await tx`
          INSERT INTO plateforme (nom)
          VALUES (${g.plateforme})
          ON CONFLICT (nom) DO NOTHING
          RETURNING idplateforme
        `;
        const id = plateformeRow[0]?.idplateforme
          ?? (await tx`SELECT idplateforme FROM plateforme WHERE nom=${g.plateforme}`)[0]?.idplateforme;
        if (id) platformeIdMap[g.plateforme] = id;
      }

      // Emplacement
      if (!emplacementIdMap[g.emplacement] && g.emplacement) {
        const emplacementRow = await tx`
          INSERT INTO emplacement (nom)
          VALUES (${g.emplacement})
          ON CONFLICT (nom) DO NOTHING
          RETURNING idemplacement
        `;
        const id = emplacementRow[0]?.idemplacement
          ?? (await tx`SELECT idemplacement FROM emplacement WHERE nom=${g.emplacement}`)[0]?.idemplacement;
        if (id) emplacementIdMap[g.emplacement] = id;
      }

      // Etat
      if (!etatIdMap[g.etat] && g.etat) {
        const etatRow = await tx`
          INSERT INTO etat (nom)
          VALUES (${g.etat})
          ON CONFLICT (nom) DO NOTHING
          RETURNING idetat
        `;
        const id = etatRow[0]?.idetat
          ?? (await tx`SELECT idetat FROM etat WHERE nom=${g.etat}`)[0]?.idetat;
        if (id) etatIdMap[g.etat] = id;
      }
    }

    // ---- Rest of your insert logic (prix, jeux with image, stock) ----
    // Make sure to use:
    // const idPlateforme = platformeIdMap[g.plateforme] ?? platformeIdMap['Unknown'];
    // const idEtat = etatIdMap[g.etat] ?? etatIdMap['Unknown'];
    // const idEmplacement = emplacementIdMap[g.emplacement] ?? emplacementIdMap['Unknown'];
  });

  console.log('✅ Import terminé avec images et IDs auto-incrémentés');

} catch (err) {
  console.error('❌ Erreur import:', err);
}
