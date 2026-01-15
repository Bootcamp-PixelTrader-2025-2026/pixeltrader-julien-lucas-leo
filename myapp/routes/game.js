export function routes(app) {
    app.get('/games', (req, res) => {
        res.send('Liste des jeux');
    });

    app.get('/games/:id', (req, res) => {
        const gameId = req.params.id;
        res.send(`Détails du jeu avec l'ID : ${gameId}`);
    });
}