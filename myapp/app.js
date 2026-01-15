import express from 'express';
import cors from 'cors';
import routes from './routes/game.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

routes(app);

app.get('/', (req, res) => {
  res.send(`Hello World! Cette app fonctionne sur le port ${port}`);
});

app.get('/user', (req, res) => {
  res.send('Got a GET request at /user');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
