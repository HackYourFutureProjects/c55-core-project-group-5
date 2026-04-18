import express from 'express';
import db from '../../data/db.js';
import { fetchBookByTitle, splitAuthorName } from '../apilibrary.js';
import { getBookTeaser } from '../llm_helper.js';
const router = express.Router();

// get last 10 books
router.get('/', (req, res) => {
  try {
    const books = db
      .prepare(
        `
      SELECT 
        b.book_id,
        b.title,
        b.isbn,
        b.publication_year,
        b.genre,
        a.first_name,
        a.last_name
      FROM books b
      JOIN authors a ON b.author_id = a.author_id
      ORDER BY b.book_id DESC
      LIMIT 10
    `
      )
      .all();

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// add book manually
/*router.post('/', (req, res) => {
  const { title, isbn, publication_year, genre, author_id } = req.body;

  if (!title || !author_id) {
    return res.status(400).json({
      error: 'title and author_id are required'
    });
  }

  try {
    const result = db.prepare(`
      INSERT INTO books (title, isbn, publication_year, genre, author_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(title, isbn, publication_year, genre, author_id);

    res.status(201).json({
      message: 'Book added successfully',
      book_id: result.lastInsertRowid
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
*/

// import book "open library"
router.post('/import', async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const genre = req.body.genre || null;

    if (!title) {
      return res.status(400).json({
        error: 'Title is required',
      });
    }

    const book = await fetchBookByTitle(title);

    if (!book) {
      return res.status(404).json({
        error: 'Book not found in Open Library',
      });
    }

    if (!book.isbn) {
      return res.status(422).json({
        error: 'Book has no ISBN',
      });
    }

    const { firstName, lastName } = splitAuthorName(book.authorName);

    const result = db.transaction(() => {
      let author = db
        .prepare(
          `
        SELECT author_id FROM authors
        WHERE first_name = ? AND last_name = ?
      `
        )
        .get(firstName, lastName);

      if (!author) {
        const insertAuthor = db
          .prepare(
            `
          INSERT INTO authors (first_name, last_name)
          VALUES (?, ?)
        `
          )
          .run(firstName, lastName);

        author = { author_id: insertAuthor.lastInsertRowid };
      }

      const existingBook = db
        .prepare(
          `
        SELECT book_id FROM books WHERE isbn = ?
      `
        )
        .get(book.isbn);

      if (existingBook) {
        return { duplicate: true };
      }

      const insertBook = db
        .prepare(
          `
        INSERT INTO books (title, isbn, author_id, publication_year, genre)
        VALUES (?, ?, ?, ?, ?)
      `
        )
        .run(
          book.title,
          book.isbn,
          author.author_id,
          book.publicationYear,
          genre
        );

      return {
        duplicate: false,
        book_id: insertBook.lastInsertRowid,
      };
    })();

    if (result.duplicate) {
      return res.status(409).json({
        error: 'Book already exists',
      });
    }

    res.status(201).json({
      message: 'Book imported successfully',
      book_id: result.book_id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// delete book
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const result = db
      .prepare(
        `
      DELETE FROM books WHERE book_id = ?
    `
      )
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Book not found',
      });
    }

    res.json({
      message: 'Book deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// get book teaser using llm_helper
router.get('/teaser', async (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({ error: 'Book title is required' });
  }

  try {
    const teaserData = await getBookTeaser(title);

    if (!teaserData) {
      return res
        .status(500)
        .json({ error: 'AI could not generate a teaser for this book.' });
    }

    res.json(teaserData);
  } catch (error) {
    console.error('Teaser Route Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
