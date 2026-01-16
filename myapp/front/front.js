/* ==========================
   CONFIGURATION
========================== */

/**
 * platformConfig : correspondance des consoles.
 * Chaque clé regroupe toutes les variantes possibles d'une console.
 * Exemple : "sony" contient toutes les façons de désigner PlayStation.
 */
const platformConfig = {
  sony: [
    'PlayStation 1',
    'PlayStation',
    'Ps1',
    'PS1',
    'PSX',
    'Playstation',
    'Playstation 1',
    'PlayStation 2',
    'PS2',
    'PS3',
  ],
  nintendo_home: [
    'Nintendo 64',
    'N64',
    'SNES',
    'Super Nintendo',
    'Super Famicom',
    'NES',
    'GameCube',
    'GCN',
    'GC',
    'Switch',
  ],
  nintendo_handheld: [
    'Game Boy',
    'GameBoy',
    'Gameboy Color',
    'Game Boy Advance',
    'GBA',
  ],
  sega: [
    'Sega Mega Drive',
    'Megadrive',
    'Master System',
    'Dreamcast',
    'Saturn',
  ],
  xbox: ['Xbox'],
  pc: ['PC'],
  retro: ['Arcade', 'Atari 2600'],
};

/**
 * conditionConfig : correspondance des états des jeux.
 * Chaque clé regroupe les libellés possibles pour cet état.
 * Exemple : "new" contient "Neuf", "Blister", "Collector", etc.
 */
const conditionConfig = {
  new: [
    'Neuf',
    'Blister',
    'Comme neuf',
    'Excellent',
    'Collector',
    'Livre Acier',
  ],
  good: [
    'Bon état',
    'Bon',
    'Occasion',
    'Platinum',
    'Grosse Boîte',
    'Sim City 2000',
  ],
  damaged_box: [
    'Boite abimée',
    'Boîte cassée',
    'Boîte manquante',
    'Jauni',
    'Abimé',
    'Abîmé',
  ],
  loose: ['Sans notice', 'Sans boîte', 'Détaché'],
  bad: ['Moyen', 'Rayé', 'Usé', 'Pourri', 'Pile HS'],
};

/**
 * STORAGE_KEY : clé utilisée pour enregistrer la collection dans le localStorage.
 * tousLesJeux : tableau contenant tous les jeux chargés.
 */
const STORAGE_KEY = 'maCollectionJeux_v1';
let tousLesJeux = [];

/* ==========================
   CHARGEMENT DES DONNÉES
========================== */

/**
 * chargerJeux : charge la collection depuis le localStorage
 * ou depuis le fichier CSV/JS d'origine si aucune sauvegarde n'existe.
 */
async function chargerJeux() {
  const resultDiv = document.getElementById('result');
  const sauvegarde = localStorage.getItem(STORAGE_KEY);

  // Si une sauvegarde existe, on l'utilise
  if (sauvegarde) {
    try {
      tousLesJeux = JSON.parse(sauvegarde);
      afficherJeux(tousLesJeux);
      return;
    } catch {
      // Si JSON invalide, on supprime et on recharge depuis CSV
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // Sinon, on récupère le fichier original
  try {
    const reponse = await fetch('/game.js');
    if (!reponse.ok) throw new Error();
    const contenu = await reponse.text();
    tousLesJeux = csvToJSON(contenu);
    afficherJeux(tousLesJeux);
  } catch {
    resultDiv.innerHTML =
      "<p class='status-error'>Erreur de chargement des données.</p>";
  }
}

/* ==========================
   AFFICHAGE DES JEUX
========================== */

/**
 * afficherJeux : affiche une liste de jeux dans la div #result
 * @param {Array} liste - tableau d'objets jeu
 */
function afficherJeux(liste) {
  const container = document.getElementById('result');
  if (!Array.isArray(liste) || liste.length === 0) {
    container.innerHTML = '<p>Aucun jeu trouvé.</p>';
    return;
  }

  container.innerHTML =
    '<ul>' +
    liste
      .map((jeu) => {
        const prix = jeu.valeur_estimee || 'N/A';
        return `
<li>
    <a href="./game.html?id=${jeu.id}">
        <strong>${jeu.titre_jeu}</strong><br>
        <span class="game-infos">
            [${jeu.plateforme}] • ${jeu.etat} • ${prix}
        </span>
    </a>
</li>`;
      })
      .join('') +
    '</ul>';
}

/* ==========================
   FILTRAGE DES JEUX
========================== */

/**
 * appliquerFiltres : filtre les jeux en fonction de la console et de l'état
 */
function appliquerFiltres() {
  const consoleVal = document.getElementById('console-select').value;
  const etatVal = document.getElementById('etat-select').value;

  const filtres = tousLesJeux.filter((jeu) => {
    const okConsole =
      consoleVal === 'all' ||
      platformConfig[consoleVal]?.includes(jeu.plateforme);
    const okEtat =
      etatVal === 'all' || conditionConfig[etatVal]?.includes(jeu.etat);
    return okConsole && okEtat;
  });

  afficherJeux(filtres);
}

/* ==========================
   IMPORT DE FICHIERS
========================== */

const btnImport = document.getElementById('btn-import');
const fileInput = document.getElementById('file-input');
const statusMsg = document.getElementById('import-status');

/**
 * setStatus : affiche un message d'état avec couleur
 * @param {string} message - texte à afficher
 * @param {string} type - 'error' ou 'success' ou ''
 */
function setStatus(message, type = '') {
  statusMsg.textContent = message;
  statusMsg.className = 'status-text';
  if (type) statusMsg.classList.add(`status-${type}`);
}

btnImport.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) {
    setStatus("Sélectionne un fichier d'abord.", 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = ({ target }) => {
    try {
      let nouveauxJeux = [];

      if (file.name.endsWith('.csv')) {
        nouveauxJeux = csvToJSON(target.result);
      } else if (file.name.endsWith('.json')) {
        nouveauxJeux = JSON.parse(target.result);
      } else {
        throw new Error('Format non supporté');
      }

      tousLesJeux = tousLesJeux.concat(nouveauxJeux);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tousLesJeux));

      setStatus(`${nouveauxJeux.length} jeux ajoutés.`, 'success');
      appliquerFiltres();
    } catch (e) {
      setStatus(e.message, 'error');
    }
  };

  reader.readAsText(file);
});

/* ==========================
   RESET
========================== */

document.getElementById('btn-reset').addEventListener('click', () => {
  if (!confirm('Tout effacer et revenir à zéro ?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

/* ==========================
   CSV → JSON
========================== */

/**
 * csvToJSON : transforme un texte CSV en tableau d'objets JS
 * @param {string} csvText - contenu CSV
 * @returns {Array} tableau d'objets jeu
 */
function csvToJSON(csvText) {
  const lignes = csvText.trim().split('\n');
  const resultats = [];

  for (let i = 1; i < lignes.length; i++) {
    // Découpe les colonnes, mais ignore les virgules à l'intérieur de guillemets
    const colonnes = lignes[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (colonnes.length < 3) continue;

    const clean = (v) => v?.replace(/^"|"$/g, '').trim() || '';

    resultats.push({
      id: clean(colonnes[0]),
      titre_jeu: clean(colonnes[1]),
      plateforme: clean(colonnes[2]),
      annee_sortie: clean(colonnes[3]),
      etat: clean(colonnes[4]),
      emplacement: clean(colonnes[5]),
      valeur_estimee: clean(colonnes[6]),
      prix_achat: clean(colonnes[7]),
    });
  }

  return resultats;
}

/* ==========================
   INIT
========================== */

chargerJeux();
document
  .getElementById('console-select')
  .addEventListener('change', appliquerFiltres);
document
  .getElementById('etat-select')
  .addEventListener('change', appliquerFiltres);
