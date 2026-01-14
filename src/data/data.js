const fs = require('fs');
const path = require('path');

function parsePrice(raw) {
  if (raw === undefined || raw === null) return 0;
  let s = String(raw).trim();
  if (s === '') return 0;

  // Remove currency symbols and non-numeric except . and , and -
  s = s.replace(/[^0-9.,-]/g, '');
  // Normalize decimal separators
  if (s.indexOf(',') > -1 && s.indexOf('.') === -1) s = s.replace(',', '.');
  else if (s.indexOf(',') > -1 && s.indexOf('.') > -1)
    s = s.replace(/\./g, '').replace(',', '.');

  let n = parseFloat(s); // parse float
  if (Number.isNaN(n)) n = 0; // 0 si parsing marche pas
  return Math.round(n * 100) / 100; // arrondi de deux décimales
}

// Normalize condition strings
function normalizeEtat(raw) {
  if (!raw) return 'Moyen';
  const s = String(raw).toLowerCase();
  if (s.includes('excel')) return 'Excellent';
  if (s.includes('bon')) return 'Bon';
  if (s.includes('mauv') || s.includes('abim') || s.includes('cass'))
    return 'Mauvais';
  return 'Moyen';
}

// Normalize platform names
function normalizePlateforme(raw) {
  if (!raw) return null;
  const parts = String(raw)
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const candidate = (parts[0] || '').toLowerCase();

  if (
    candidate.includes('nintendo 64') ||
    candidate === 'n64' ||
    candidate.includes('n64')
  )
    return 'N64';
  if (
    candidate.includes('playstation 1') ||
    candidate === 'ps1' ||
    (candidate.includes('playstation') && candidate.includes('1'))
  )
    return 'PS1';
  if (candidate === 'ps1' || candidate.includes('ps1')) return 'PS1';
  if (candidate.includes('ps2') || candidate.includes('playstation 2'))
    return 'PS2';
  if (candidate.includes('switch')) return 'Switch';
  if (candidate.includes('wii')) return 'Wii';
  if (candidate.includes('gameboy')) return 'GameBoy';

  return parts[0].replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}

function parseCSV(filePath = path.join(__dirname, '../../stock.csv')) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`CSV file not found: ${absPath}`);
  }

  const csv = fs.readFileSync(absPath, 'utf8');
  if (!csv) return [];

  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  const idx = (name) => headers.indexOf(name);

  const missingYear = [];
  const results = [];

  lines.slice(1).forEach((line, lineNumber) => {
    const values = line.split(',');

    const emplacement = (values[idx('emplacement')] || values[5] || '').trim();
    if (emplacement && emplacement.toLowerCase() === 'poubelle') return; // skip

    const id = Number(values[idx('id')] || values[0]) || null;
    const titre_jeu = values[idx('titre_jeu')] || values[1] || null;
    const plateformeRaw = values[idx('plateforme')] || values[2] || null;
    const annee_raw = values[idx('annee_sortie')] || values[3] || '';
    const etatRaw = values[idx('etat')] || values[4] || null;
    const valeurRaw = values[idx('valeur_estimee')] || values[6] || null;
    const prixRaw = values[idx('prix_achat')] || values[7] || null;

    let prix_achat = parsePrice(prixRaw);
    let valeur_estimee = parsePrice(valeurRaw);

    // si prix manquant ou 0 on utilise l'autre et vice versa
    if (
      (!prix_achat || prix_achat === 0) &&
      valeur_estimee &&
      valeur_estimee > 0
    ) {
      prix_achat = valeur_estimee;
    }
    if (
      (!valeur_estimee || valeur_estimee === 0) &&
      prix_achat &&
      prix_achat > 0
    ) {
      valeur_estimee = prix_achat;
    }

    // check pour date de sortie manquante

    let annee_sortie = annee_raw ? Number(annee_raw) : null;
    if (!annee_sortie) {
      missingYear.push({
        id,
        titre_jeu,
        plateforme: normalizePlateforme(plateformeRaw),
        line: lineNumber + 2,
      });
    }

    // OBJET FINALE
    const item = {
      id,
      titre_jeu: titre_jeu || null,
      plateforme: normalizePlateforme(plateformeRaw),
      annee_sortie: annee_sortie || null,
      etat: normalizeEtat(etatRaw),
      emplacement: emplacement || null,
      valeur_estimee,
      prix_achat,
    };

    results.push(item);
  });

  if (missingYear.length > 0) {
    const outPath = path.join(
      path.dirname(absPath),
      'stock_legacy_missing_year.csv'
    );
    const linesOut = ['id,titre_jeu,plateforme,lineNumber'];
    missingYear.forEach((m) =>
      linesOut.push(
        `${m.id || ''},"${(m.titre_jeu || '').replace(/"/g, '""')}",${
          m.plateforme || ''
        },${m.line}`
      )
    );
    try {
      fs.writeFileSync(outPath, linesOut.join('\n'), 'utf8');
    } catch (e) {
      // ignore write errors but continue
    }
  }

  // wjosn parsé à la racine.
  try {
    const jsonOutPath = path.join(path.dirname(absPath), 'stock_parsed.json');
    fs.writeFileSync(jsonOutPath, JSON.stringify(results, null, 2), 'utf8');
  } catch (e) {
  }

  return results;
}

function isCSVok(filePath) {
  const absPath = path.resolve(
    filePath || path.join(__dirname, '../../stock.csv')
  );
  try {
    return fs.existsSync(absPath) && fs.statSync(absPath).size > 0;
  } catch (e) {
    return false;
  }
}

module.exports = { parseCSV, isCSVok };
