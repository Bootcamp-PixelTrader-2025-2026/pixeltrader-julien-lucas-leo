import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    'postgresql://postgres:password@localhost:5432/pixeltrader',
});

export function routes(app) {
  app.get('/games', async (req, res) => {
    const client = await pool.connect();
    try {
      const q = `
        SELECT
          j.id,
          j.titre AS titre_jeu,
          p.nom AS plateforme,
          j.anneesortie AS annee_sortie,
          e.nom AS etat,
          em.nom AS emplacement,
          pr.valeur_estimee,
          (
            SELECT prixachat FROM pixeltraderinc.stock s WHERE s.idjeu = j.id
            ORDER BY s.id DESC LIMIT 1
          ) AS prix_achat
        FROM pixeltraderinc.jeux j
        LEFT JOIN pixeltraderinc.plateforme p ON j.idplateforme = p.id
        LEFT JOIN pixeltraderinc.etat e ON j.idetat = e.id
        LEFT JOIN pixeltraderinc.emplacement em ON j.idemplacement = em.id
        LEFT JOIN pixeltraderinc.prix pr ON j.idprix = pr.id
        ORDER BY j.id;
      `;
      const { rows } = await client.query(q);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'DB_ERROR', message: err.message });
    } finally {
      client.release();
    }
  });

  app.get('/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    const client = await pool.connect();
    try {
      const q = `
        SELECT
          j.id,
          j.titre AS titre_jeu,
          p.nom AS plateforme,
          j.anneesortie AS annee_sortie,
          e.nom AS etat,
          em.nom AS emplacement,
          pr.valeur_estimee,
          (
            SELECT prixachat FROM pixeltraderinc.stock s WHERE s.idjeu = j.id
            ORDER BY s.id DESC LIMIT 1
          ) AS prix_achat
        FROM pixeltraderinc.jeux j
        LEFT JOIN pixeltraderinc.plateforme p ON j.idplateforme = p.id
        LEFT JOIN pixeltraderinc.etat e ON j.idetat = e.id
        LEFT JOIN pixeltraderinc.emplacement em ON j.idemplacement = em.id
        LEFT JOIN pixeltraderinc.prix pr ON j.idprix = pr.id
        WHERE j.id = $1
        LIMIT 1;
      `;
      const { rows } = await client.query(q, [id]);
      if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'DB_ERROR', message: err.message });
    } finally {
      client.release();
    }
  });
}
