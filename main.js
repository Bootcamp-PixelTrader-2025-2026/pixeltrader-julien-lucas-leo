#!/usr/bin/env node
const path = require("path");
const { parseCSV, isCSVok } = require("./src/data/data");

const csvPath = process.argv[2] || path.join(__dirname, "stock.csv");

try {
  if (!isCSVok(csvPath)) {
    console.error("CSV introuvable ou vide:", csvPath);
    process.exit(1);
  }

  const data = parseCSV(csvPath);
  console.log(JSON.stringify(data, null, 2));
} catch (err) {
  console.error("Erreur:", err.message);
  process.exit(1);
}