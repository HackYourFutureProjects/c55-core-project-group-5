import express from 'express';
import db from '../data/db.js';
import bookRoutes from './routes/books.js';
import memberRoutes from './routes/members.js';
import loansRoutes from './routes/loans.js';
const app = express();


app.use(express.json());
app.use('/loans', loansRoutes);


app.use('/books', bookRoutes);
app.use('/members', memberRoutes);


app.get('/', (req, res) => {
  res.send('API is running ');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

export { app };