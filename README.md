# Pixeltrader
Petit utilitaire pour convertir le fichier `stock.csv` en JSON.

## Installation & Start

- Download the folder or clone the repository using
``` bash
git clone https://github.com/Bootcamp-PixelTrader-2025-2026/pixeltrader-julien-lucas-leo.git
```
- Open the project in any local development server.
- Install dependencies
```bash
npm install
```
- Run the local server at localhost:3000
- Be in myapp folder
```bash
 node app.js 
```
- Lancer le parseur (affiche JSON sur stdout)
```bash
npm run parse -- path/to/stock.csv
```
Si aucun chemin n'est fourni, `stock.csv` à la racine du projet sera utilisé.
<br>
<br>

Scripts utiles:
- `npm start` ou `npm run parse` : exécute `main.js` et affiche le JSON
- `npm run lint` : exécute ESLint (installer les dépendances)
- `npm run format` : formate le code avec Prettier


## Authors
@LeoVigin
@JulienC7
@LucasAudoubert
