import express from 'express';
import db from '../data/db.js';
import memberRoutes from './routes/members.js';

const app = express();
app.use(express.json());
app.use('/members', memberRoutes);

app.get('/books', (req, res) => {
  const query = `
    SELECT 
      books.book_id,
      books.title,
      books.isbn,
      books.publication_year,
      books.genre,
      authors.first_name,
      authors.last_name
    FROM books
    JOIN authors ON books.author_id = authors.author_id
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

export { app };
