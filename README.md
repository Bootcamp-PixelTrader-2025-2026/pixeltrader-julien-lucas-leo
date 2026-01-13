# pixeltrader-julien-lucas-leo

Petit utilitaire pour convertir le fichier `stock.csv` en JSON.

Usage rapide:

- Installer les dépendances (optionnel pour lint/format):

```bash
npm install
```

- Lancer le parseur (affiche JSON sur stdout):

```bash
npm run parse -- path/to/stock.csv
```

Si aucun chemin n'est fourni, `stock.csv` à la racine du projet sera utilisé.

Scripts utiles:

- `npm start` ou `npm run parse` : exécute `main.js` et affiche le JSON
- `npm run lint` : exécute ESLint (installer les dépendances)
- `npm run format` : formate le code avec Prettier
