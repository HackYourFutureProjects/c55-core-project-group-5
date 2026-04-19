import express from 'express';
import db from '../../data/db.js';

const router = express.Router();

// loan a book
router.post('/', (req, res) => {
  const { book_id, member_id } = req.body;

  if (!book_id || !member_id) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const book = db
      .prepare('SELECT book_id FROM books WHERE book_id = ?')
      .get(book_id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const member = db
      .prepare('SELECT member_id FROM members WHERE member_id = ?')
      .get(member_id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const existingLoan = db
      .prepare(`SELECT loan_id FROM loans WHERE book_id = ? AND returned = 0`)
      .get(book_id);

    if (existingLoan) {
      return res.status(409).json({ error: 'This book is already loaned.' });
    }

    const info = db
      .prepare(`INSERT INTO loans (book_id, member_id, loan_date) VALUES (?, ?, datetime('now'))`)
      .run(book_id, member_id);

    res.status(201).json({
      message: 'Book loaned successfully',
      loan_id: info.lastInsertRowid,
    });

  } catch (err) {
    console.error('Loan Error:', err.message);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

// return a book
router.patch('/return/:id', (req, res) => {
  const { id } = req.params;

  try {
    const info = db
      .prepare(`UPDATE loans SET returned = 1, return_date = datetime('now') WHERE loan_id = ?`)
      .run(id);

    if (info.changes > 0) {
      res.json({ message: 'Book returned successfully.' });
    } else {
      res.status(404).json({ error: 'Loan not found.' });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get all active loans
router.get('/', (req, res) => {
  try {
    const loans = db
      .prepare(`
        SELECT l.loan_id, b.title, m.name, m.email, l.loan_date
        FROM loans l
        JOIN books b ON l.book_id = b.book_id
        JOIN members m ON l.member_id = m.member_id
        WHERE l.returned = 0
      `)
      .all();

    res.json(loans);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get loan history for a book
router.get('/book/:id', (req, res) => {
  const { id } = req.params;

  try {
    const history = db
      .prepare(`
        SELECT l.loan_id, m.name, l.loan_date, l.return_date, l.returned
        FROM loans l
        JOIN members m ON l.member_id = m.member_id
        WHERE l.book_id = ?
      `)
      .all(id);

    res.json(history);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;