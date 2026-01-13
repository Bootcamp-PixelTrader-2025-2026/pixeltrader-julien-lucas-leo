const fs = require("fs");

const csv = fs.readFileSync("jeux.csv", "utf8");

const lines = csv.trim().split("\n");
const headers = lines[0].split(",");

const json = lines.slice(1).map((line) => {
  const values = line.split(",");

  return {
    id: Number(values[0]),
    titre_jeu: values[1],
    plateforme: values[2],
    annee_sortie: Number(values[3]),
    etat: values[4],
    emplacement: values[5],
    valeur_estimee: Number(values[6]),
    prix_achat: Number(values[7]),
  };
});

console.log(json);

function isCSVok() {
  return csv && csv.length > 0;
}