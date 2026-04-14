import express from 'express';
import db from '../../data/db.js';

const router = express.Router();

router.post('/', (req, res) => {
  console.log('content-type:', req.headers['content-type']);
  console.log('body:', req.body);

  const body = req.body ?? {};
  const { title, isbn, publication_year, genre, author_id } = body;

  console.log('title value:', title);
  console.log('author_id value:', author_id);

  if (!title || !author_id) {
    return res.status(400).json({
      error: 'title and author_id are required'
    });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO books (title, isbn, publication_year, genre, author_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      isbn,
      publication_year,
      genre,
      author_id
    );

    return res.status(201).json({
      message: 'Book added successfully',
      bookId: result.lastInsertRowid
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message
    });
  }
});
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare(`
      DELETE FROM books
      WHERE book_id = ?
    `);

    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Book not found'
      });
    }

    return res.json({
      message: 'Book deleted successfully'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message
    });
  }
});

export default router;

