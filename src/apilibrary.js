import express from 'express';
import Database from 'better-sqlite3';
import axios from 'axios';

const app = express();
const PORT = 3000;

const db = new Database('books.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    year INTEGER,
    isbn TEXT
  )
`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <h1>Books Library</h1>
    <form action="/add" method="post">
      <input name="title" placeholder="Enter book title" required />
      <button type="submit">Add Book</button>
    </form>
    <br>
    <a href="/books">Show Books</a>
  `);
});

app.post('/add', async (req, res) => {
  try {
    const title = (req.body.title || '').trim();

    if (!title) {
      return res.send('Empty title');
    }

    const response = await axios.get('https://openlibrary.org/search.json', {
      params: {
        title,
        limit: 1,
        fields: 'title,author_name,first_publish_year,isbn',
      },
    });

    const docs = response.data.docs;

    if (!docs || docs.length === 0) {
      return res.send('Book not found');
    }

    const book = docs[0];

    const bookTitle = book.title || 'Unknown title';
    const author = book.author_name ? book.author_name[0] : 'Unknown author';
    const year = book.first_publish_year || null;
    const isbn = book.isbn ? book.isbn[0] : null;

    db.prepare(`
      INSERT INTO books (title, author, year, isbn)
      VALUES (?, ?, ?, ?)
    `).run(bookTitle, author, year, isbn);

    res.send(`
      <h2>Book added</h2>
      <p>Title: ${bookTitle}</p>
      <p>Author: ${author}</p>
      <p>Year: ${year ?? '-'}</p>
      <p>ISBN: ${isbn ?? '-'}</p>
      <a href="/">Back</a>
    `);
  } catch (error) {
    res.send(`Error: ${error.message}<br><a href="/">Back</a>`);
  }
});

app.get('/books', (req, res) => {
  const books = db.prepare('SELECT * FROM books ORDER BY id DESC').all();

  let html = '<h1>Books</h1><a href="/">Back</a><br><br>';

  for (const book of books) {
    html += `
      <div>
        <b>${book.title}</b><br>
        Author: ${book.author ?? '-'}<br>
        Year: ${book.year ?? '-'}<br>
        ISBN: ${book.isbn ?? '-'}<br><br>
      </div>
    `;
  }

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Server started on http://127.0.0.1:${PORT}`);
});