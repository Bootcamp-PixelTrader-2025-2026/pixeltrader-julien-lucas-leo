import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pixeltraderinc',
  port: 5432,
});

// Nettoie "50€" -> 50
function euroToNumber(value) {
  if (!value) return null;
  return Number(value.replace('€', '').trim());
}

async function importJSON() {
  const raw = fs.readFileSync('jeux.json', 'utf-8');
  const jeux = JSON.parse(raw);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const jeu of jeux) {
      await client.query(
        `
        INSERT INTO jeux
        (titre_jeu, plateforme, annee_sortie, etat, emplacement, valeur_estimee, prix_achat)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          jeu.titre_jeu,
          jeu.plateforme,
          Number(jeu.annee_sortie),
          jeu.etat,
          jeu.emplacement,
          euroToNumber(jeu.valeur_estimee),
          euroToNumber(jeu.prix_achat),
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Import terminé');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur :', err);
  } finally {
    client.release();
    pool.end();
  }
}

importJSON();

// interface Jeu {
//     id?: number;
//     titre_jeu: string | null;
//     plateforme: string | null;
//     annee_sortie: number | null;
//     etat: string | null;
//     emplacement: string | null;
//     valeur_estimee: number | null;
//     prix_achat: number | null;
// }

export { importJSON, Jeu };
