import express from 'express';
import db from '../data/db.js';
import inventoryRoutes from './routes/inventory.js';
import memberRoutes from './routes/members.js';

const app = express();


app.use(express.json());


app.use('/books', inventoryRoutes);
app.use('/members', memberRoutes);

app.get('/', (req, res) => {
  res.send('API is running ');
});

app.get('/', (req, res) => {
  res.send('API is running ');
});


if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

export { app };