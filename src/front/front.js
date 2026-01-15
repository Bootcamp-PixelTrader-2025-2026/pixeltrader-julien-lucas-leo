// --- 1. CONFIGURATION ---
const platformConfig = {
    "sony": ["PlayStation 1", "PlayStation", "Ps1", "PS1", "PSX", "Playstation", "Playstation 1", "PlayStation 2", "PS2", "PS3"],
    "nintendo_home": ["Nintendo 64", "N64", "SNES", "Super Nintendo", "Super Famicom", "NES", "GameCube", "GCN", "GC", "Switch"],
    "nintendo_handheld": ["Game Boy", "GameBoy", "Gameboy Color", "Game Boy Advance", "GBA"],
    "sega": ["Sega Mega Drive", "Megadrive", "Master System", "Dreamcast", "Saturn"],
    "xbox": ["Xbox"],
    "pc": ["PC"],
    "retro": ["Arcade", "Atari 2600"]
};

const conditionConfig = {
    "new": ["Neuf", "Blister", "Comme neuf", "Excellent", "Collector", "Livre Acier"],
    "good": ["Bon état", "Bon", "Occasion", "Platinum", "Grosse Boîte", "Sim City 2000"],
    "damaged_box": ["Boite abimée", "Boîte cassée", "Boîte manquante", "Jauni", "Abimé", "Abîmé "],
    "loose": ["Sans notice", "Sans boîte", "Détaché"],
    "bad": ["Moyen", "Rayé", "Usé", "Pourri", "Pile HS"]
};

let tousLesJeux = [];
const STORAGE_KEY = 'maCollectionJeux_v1';

// --- 2. CHARGEMENT ---
async function chargerJeux() {
    const resultDiv = document.getElementById('result');
    
    const sauvegarde = localStorage.getItem(STORAGE_KEY);

    if (sauvegarde) {
        console.log("Chargement depuis la sauvegarde...");
        tousLesJeux = JSON.parse(sauvegarde);
        afficherJeux(tousLesJeux);
    } 
    else {
        console.log("Lecture CSV original...");
        try {
            // Assure-toi que 'games.csv' est bien à côté de ton index.html
            const reponse = await fetch('games.csv'); 
            if (!reponse.ok) throw new Error("Fichier games.csv introuvable");
            
            const textCSV = await reponse.text();
            tousLesJeux = csvToJSON(textCSV);
            afficherJeux(tousLesJeux);
        } catch (error) {
            console.error(error);
            resultDiv.innerHTML = "<p class='status-error'>Erreur de chargement des données.</p>";
        }
    }
}

// --- 3. AFFICHAGE (Plus de style inline) ---
function afficherJeux(liste) {
    const container = document.getElementById('result');
    if (liste.length === 0) {
        container.innerHTML = "<p>Aucun jeu trouvé.</p>";
        return;
    }

    let html = '<ul>';
    liste.forEach(jeu => {
        let prix = jeu.valeur_estimee ? jeu.valeur_estimee.replace(/"/g, '') : "N/A";
        
        // J'ai remplacé le style inline par la classe 'game-infos' définie dans le CSS
        html += `
            <li>
                <strong>${jeu.titre_jeu}</strong><br>
                <span class="game-infos">
                    [${jeu.plateforme}] • ${jeu.etat} • ${prix}
                </span>
            </li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
}

function appliquerFiltres() {
    const valConsole = document.getElementById('console-select').value;
    const valEtat = document.getElementById('etat-select').value;

    const resultats = tousLesJeux.filter(jeu => {
        let matchConsole = (valConsole === "all");
        if (!matchConsole && platformConfig[valConsole]) {
            matchConsole = platformConfig[valConsole].includes(jeu.plateforme);
        }
        let matchEtat = (valEtat === "all");
        if (!matchEtat && conditionConfig[valEtat]) {
            matchEtat = conditionConfig[valEtat].includes(jeu.etat);
        }
        return matchConsole && matchEtat;
    });
    afficherJeux(resultats);
}

// --- 4. IMPORTATION (Gestion des classes CSS pour les messages) ---
const btnImport = document.getElementById('btn-import');
const fileInput = document.getElementById('file-input');
const statusMsg = document.getElementById('import-status');

// Helper pour changer le statut proprement
function setStatus(message, type) {
    statusMsg.innerText = message;
    // On enlève toutes les classes de couleur
    statusMsg.classList.remove('status-error', 'status-success');
    // On ajoute la bonne classe si nécessaire
    if (type === 'error') statusMsg.classList.add('status-error');
    if (type === 'success') statusMsg.classList.add('status-success');
}

btnImport.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) {
        setStatus("Sélectionne un fichier d'abord !", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        let nouveauxJeux = [];

        try {
            if (file.name.toLowerCase().endsWith('.csv')) {
                nouveauxJeux = csvToJSON(content);
            } else if (file.name.toLowerCase().endsWith('.json')) {
                nouveauxJeux = JSON.parse(content);
            } else {
                throw new Error("Format non supporté (CSV ou JSON uniquement)");
            }

            tousLesJeux = [...tousLesJeux, ...nouveauxJeux];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tousLesJeux));

            setStatus(`Succès ! ${nouveauxJeux.length} jeux ajoutés.`, "success");
            appliquerFiltres(); 

        } catch (err) {
            setStatus("Erreur : " + err.message, "error");
        }
    };
    reader.readAsText(file);
});

// --- 5. RESET ---
document.getElementById('btn-reset').addEventListener('click', () => {
    if(confirm("Tout effacer et revenir à zéro ?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
});

// --- 6. UTILITAIRE CSV ---
function csvToJSON(csvText) {
    const lines = csvText.trim().split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        const col = lines[i].split(regex);
        
        if (col.length > 2) {
            const clean = (txt) => txt ? txt.replace(/^"|"$/g, '').trim() : "";
            result.push({
                id: clean(col[0]),
                titre_jeu: clean(col[1]),
                plateforme: clean(col[2]),
                annee_sortie: clean(col[3]),
                etat: clean(col[4]),
                emplacement: clean(col[5]),
                valeur_estimee: clean(col[6]),
                prix_achat: clean(col[7])
            });
        }
    }
    return result;
}

// Init
chargerJeux();
document.getElementById('console-select').addEventListener('change', appliquerFiltres);
document.getElementById('etat-select').addEventListener('change', appliquerFiltres);