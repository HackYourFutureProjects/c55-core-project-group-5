import express from 'express';
import axios from 'axios';
import db from '../data/db.js';

const app = express();
const PORT = 3000;

app.use(express.json());

function splitAuthorName(fullName = 'Unknown Author') {
  const clean = fullName.trim();

  if (!clean) {
    return { firstName: 'Unknown', lastName: 'Author' };
  }

  const parts = clean.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Unknown' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function normalizeBook(doc) {
  return {
    title: doc?.title?.trim() || null,
    authorName:
      Array.isArray(doc?.author_name) && doc.author_name[0]
        ? doc.author_name[0].trim()
        : 'Unknown Author',
    publicationYear: Number.isInteger(doc?.first_publish_year)
      ? doc.first_publish_year
      : null,
    isbn:
      Array.isArray(doc?.isbn) && doc.isbn[0]
        ? String(doc.isbn[0]).trim()
        : null,
  };
}

async function fetchBookByTitle(title) {
  const response = await axios.get('https://openlibrary.org/search.json', {
    params: {
      title,
      limit: 1,
      fields: 'title,author_name,first_publish_year,isbn',
    },
    timeout: 10000,
  });

  const docs = response.data?.docs;

  if (!docs || docs.length === 0) {
    return null;
  }

  return normalizeBook(docs[0]);
}

app.get('/', (req, res) => {
  res.json({
    message: 'Books API is running',
    endpoints: {
      health: 'GET /',
      allBooks: 'GET /books',
      searchBook: 'GET /books/search?title=...',
      importBook: 'POST /books/import',
    },
  });
});

app.get('/books', (req, res) => {
  try {
    const rows = db
      .prepare(
        `
        SELECT
          b.book_id,
          b.title,
          b.isbn,
          b.publication_year,
          b.genre,
          a.author_id,
          a.first_name,
          a.last_name
        FROM books b
        JOIN authors a ON b.author_id = a.author_id
        ORDER BY b.book_id DESC
      `
      )
      .all();

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/books/search', async (req, res) => {
  try {
    const title = (req.query.title || '').trim();

    if (!title) {
      return res.status(400).json({
        error: 'Query parameter "title" is required',
      });
    }

    const book = await fetchBookByTitle(title);

    if (!book) {
      return res.status(404).json({
        error: 'Book not found in Open Library',
      });
    }

    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to fetch book from Open Library',
      details: error.message,
    });
  }
});

app.post('/books/import', async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const genre =
      typeof req.body.genre === 'string' && req.body.genre.trim()
        ? req.body.genre.trim()
        : null;

    if (!title) {
      return res.status(400).json({
        error: 'Field "title" is required',
      });
    }

    const book = await fetchBookByTitle(title);

    if (!book) {
      return res.status(404).json({
        error: 'Book not found in Open Library',
      });
    }

    if (!book.title) {
      return res.status(422).json({
        error: 'Open Library returned a result without title',
      });
    }

    if (!book.isbn) {
      return res.status(422).json({
        error:
          'Open Library returned a result without ISBN; cannot insert because books.isbn is NOT NULL',
      });
    }

    const { firstName, lastName } = splitAuthorName(book.authorName);

    const result = db.transaction(() => {
      let author = db
        .prepare(
          `
          SELECT author_id
          FROM authors
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

        author = { author_id: Number(insertAuthor.lastInsertRowid) };
      }

      const existingBook = db
        .prepare(
          `
          SELECT book_id
          FROM books
          WHERE isbn = ?
        `
        )
        .get(book.isbn);

      if (existingBook) {
        return {
          duplicate: true,
          book_id: existingBook.book_id,
          author_id: author.author_id,
        };
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
        book_id: Number(insertBook.lastInsertRowid),
        author_id: author.author_id,
      };
    })();

    if (result.duplicate) {
      return res.status(409).json({
        error: 'Book with this ISBN already exists',
        existing_book_id: result.book_id,
      });
    }

    res.status(201).json({
      message: 'Book imported successfully',
      book: {
        book_id: result.book_id,
        title: book.title,
        isbn: book.isbn,
        publication_year: book.publicationYear,
        genre,
        author_id: result.author_id,
        author_name: book.authorName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to import book',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
