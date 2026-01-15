# PixelTrader — Backend Documentation

Résumé rapide
- Backend Node.js + Express exposant une API pour récupérer la biblio de jeux depuis Postgres.
- Parser CSV → JSON (fichier généré : `stock_parsed.json`) + export des entrées sans année vers `stock_legacy_missing_year.csv`.
- Importer le JSON dans Postgres (schéma `pixeltraderinc`) via script d'import.

Arborescence importante
- myapp/
  - app.js — serveur Express (port 3000)
  - routes/game.js — routes API (/games, /games/:id)
- src/data/
  - data.js — parser CSV, normalisation, écrit `stock_parsed.json` et `stock_legacy_missing_year.csv`
  - import_model_db.js — import JSON -> Postgres (crée schema/tables si nécessaire)
  - database.js — helper Postgres (init, insertItems) (si présent)
- db.sql — modèle / export (MySQL Workbench) — référence
- stock.csv — (fichier source, racine projet)
- stock_parsed.json — (généré par le parser à la racine du dossier du CSV)

Règles du parser (résumé)
- Si `prix_achat` est NULL, on met `prix_achat = valeur_estimee`. Si `valeur_estimee` est NULL, on met `valeur_estimee = prix_achat`.
- La currency n'est pas modifiée (on extrait la valeur numérique mais ne convertit pas la devise).
- États normalisés : Excellent, Bon, Moyen, Mauvais.
- Si `emplacement` === "Poubelle" → ligne supprimée.
- Harmonisation plateformes (exemples) : `Nintendo 64` / `Nintendo; N64` → `N64`, `Playstation 1` / `PS1` → `PS1`.
- Génère `stock_legacy_missing_year.csv` pour les lignes sans année de sortie.

Installation & usage
1. Installer dépendances
   - npm install

2. Parser CSV → JSON
   - (si package.json fournit la commande) :
     - npm run parse -- stock.csv
   - ou exécuter le script principal/CLI fourni (si présent) :
     - node main.js stock.csv
   - Résultat : `stock_parsed.json` écrit à côté de `stock.csv`.

3. Importer `stock_parsed.json` en Postgres
   - Assurez-vous d'avoir Postgres disponible et la variable d'environnement `DATABASE_URL` ou modifiez la connection string dans `src/data/import_model_db.js`.
   - Commande :
     - node src/data/import_model_db.js stock_parsed.json
   - Le script crée le schema `pixeltraderinc` et les tables : etat, plateforme, emplacement, prix, jeux, stock.

4. Lancer l'API Express
   - node myapp/app.js
   - Par défaut : http://localhost:3000

Endpoints API
- GET / → page d'accueil (test)
- GET /games → liste des jeux (titre, plateforme, année, état, emplacement, valeur_estimee, prix_achat)
- GET /games/:id → détail d'un jeu

Notes DB / modèle
- Schéma utilisé par le script d'import : `pixeltraderinc`
- Tables créées automatiquement par `import_model_db.js` :
  - pixeltraderinc.etat (id, nom)
  - pixeltraderinc.plateforme (id, nom)
  - pixeltraderinc.emplacement (id, nom)
  - pixeltraderinc.prix (id, valeur_estimee)
  - pixeltraderinc.jeux (titre, idplateforme, anneesortie, idetat, idemplacement, idprix)
  - pixeltraderinc.stock (idjeu, disponibilite, prixachat, idprix)

Conseils rapides
- Définir DATABASE_URL pour production : export DATABASE_URL=postgresql://user:pass@host:5432/db
- Vérifier `stock_parsed.json` avant import.
- Utiliser PgAdmin / psql pour vérifier les tables après import.

Support / debugging
- Logs du parser : écrire des consoles (vérifier écriture `stock_parsed.json` et `stock_legacy_missing_year.csv`).
- Si erreurs DB : vérifier connection string et les droits de création de schéma.