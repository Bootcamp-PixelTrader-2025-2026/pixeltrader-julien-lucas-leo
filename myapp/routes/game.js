import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/pixeltrader',
});

export default function routes(app) {
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
          ) AS prix_achat,
          imgs.images
        FROM pixeltraderinc.jeux j
        LEFT JOIN pixeltraderinc.plateforme p ON j.idplateforme = p.id
        LEFT JOIN pixeltraderinc.etat e ON j.idetat = e.id
        LEFT JOIN pixeltraderinc.emplacement em ON j.idemplacement = em.id
        LEFT JOIN pixeltraderinc.prix pr ON j.idprix = pr.id
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object('id', img.id, 'filename', img.filename, 'mime', img.mime)) AS images
          FROM pixeltraderinc.images img WHERE img.idjeu = j.id
        ) imgs ON true
        ORDER BY j.id;
      `;
      const { rows } = await client.query(q);
      // ensure images is empty array instead of null
      rows.forEach((r) => {
        if (!r.images) r.images = [];
      });
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
          ) AS prix_achat,
          imgs.images
        FROM pixeltraderinc.jeux j
        LEFT JOIN pixeltraderinc.plateforme p ON j.idplateforme = p.id
        LEFT JOIN pixeltraderinc.etat e ON j.idetat = e.id
        LEFT JOIN pixeltraderinc.emplacement em ON j.idemplacement = em.id
        LEFT JOIN pixeltraderinc.prix pr ON j.idprix = pr.id
        LEFT JOIN LATERAL (
          SELECT json_agg(json_build_object('id', img.id, 'filename', img.filename, 'mime', img.mime)) AS images
          FROM pixeltraderinc.images img WHERE img.idjeu = j.id
        ) imgs ON true
        WHERE j.id = $1
        LIMIT 1;
      `;
      const { rows } = await client.query(q, [id]);
      if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      if (!rows[0].images) rows[0].images = [];
      // Add direct URL for each image so the front can render them
      rows[0].images = rows[0].images.map((img) => ({
        id: img.id,
        filename: img.filename,
        mime: img.mime,
        url: `/images/${img.id}`,
      }));
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'DB_ERROR', message: err.message });
    } finally {
      client.release();
    }
  });

  // Serve image binary by id
  app.get('/images/:imageId', async (req, res) => {
    const imageId = Number(req.params.imageId);
    if (Number.isNaN(imageId))
      return res.status(400).json({ error: 'INVALID_ID' });
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        'SELECT filename, mime, data FROM pixeltraderinc.images WHERE id = $1',
        [imageId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      const img = rows[0];
      res.setHeader('Content-Type', img.mime || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${img.filename}"`
      );
      res.send(img.data);
    } catch (err) {
      res.status(500).json({ error: 'DB_ERROR', message: err.message });
    } finally {
      client.release();
    }
  });
}
