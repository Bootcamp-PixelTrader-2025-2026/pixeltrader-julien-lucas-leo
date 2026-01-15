const express = require('express');
const app = express();
const port = 3000;

import routes from './myapp/routes/game.js';


routes(app)

app.get('/', (req, res) => {
  res.send(`Hello World! Cette app fonctionne sur le port ${port}`);
});

app.get('/user', (req, res) => {
  res.send('Got a GET request at /user');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});