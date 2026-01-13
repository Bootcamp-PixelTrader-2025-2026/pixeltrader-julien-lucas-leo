const fs = require("fs");
const path = require("path");

function parseCSV(filePath = path.join(__dirname, "../../stock.csv")) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`CSV file not found: ${absPath}`);
  }

  const csv = fs.readFileSync(absPath, "utf8");
  if (!csv) return [];

  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");

    return {
      id: Number(values[0]) || null,
      titre_jeu: values[1] || null,
      plateforme: values[2] || null,
      annee_sortie: values[3] ? Number(values[3]) : null,
      etat: values[4] || null,
      emplacement: values[5] || null,
      valeur_estimee: values[6] ? Number(values[6]) : 0,
      prix_achat: values[7] ? Number(values[7]) : 0,
    };
  });
}

function isCSVok(filePath) {
  const absPath = path.resolve(
    filePath || path.join(__dirname, "../../stock.csv")
  );
  try {
    return fs.existsSync(absPath) && fs.statSync(absPath).size > 0;
  } catch (e) {
    return false;
  }
}

module.exports = { parseCSV, isCSVok };
