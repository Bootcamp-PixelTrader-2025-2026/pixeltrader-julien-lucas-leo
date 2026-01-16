const params = new URLSearchParams(window.location.search);
const id = params.get('id'); // ex: 2

async function loadGame() {
    const res = await fetch(`/games/${id}`); // Appelle ton API
    if (!res.ok) {
        document.getElementById('game-detail').innerHTML = 'Jeu non trouvé';
        return;
    }
    const game = await res.json();
    document.getElementById('game-detail').innerHTML = `
        <h1>${game.titre_jeu}</h1>
        <p>Console : ${game.plateforme}</p>
        <p>État : ${game.etat}</p>
        <p>Valeur estimée : ${game.valeur_estimee}€</p>
    `;
}

loadGame();