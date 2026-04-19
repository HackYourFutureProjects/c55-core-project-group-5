import express from 'express';
import db from '../../data/db.js';

const router = express.Router();

//loan a book
router.post('/', (req, res) => {
  const { book_id, member_id } = req.body;

  if (!book_id || !member_id) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    //check if book is already loaned
    const existingLoan = db
      .prepare(
        `
      SELECT loan_id FROM loans
      WHERE book_id = ? AND returned = 0
    `
      )
      .get(book_id);

    if (existingLoan) {
      return res.status(409).json({
        error: 'This book is already loaned',
      });
    }

    const result = db
      .prepare(
        `
      INSERT INTO loans (book_id, member_id, loan_date)
      VALUES (?, ?, datetime('now'))
    `
      )
      .run(book_id, member_id);

    res.json({
      message: 'Book loaned successfully',
      loanId: result.lastInsertRowid,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//const stmt = db.prepare(`
//INSERT INTO loans (book_id, member_id, loan_date)
// VALUES (?, ?, datetime('now'))
//`);

//const result = stmt.run(book_id, member_id);

//res.json({
// message: 'Book loaned successfully',
//loanId: result.lastInsertRowid
//});
//});

//return a book
router.patch('/return/:id', (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare(`
    UPDATE loans
    SET returned = 1,
        return_date = datetime('now')
    WHERE loan_id = ?
  `);

  const result = stmt.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Loan not found' });
  }

  res.json({
    message: 'Book returned successfully',
  });
});

//get all active loan
router.get('/', (req, res) => {
  const stmt = db.prepare(`
    SELECT 
      l.loan_id,
      b.title,
      m.name,
      m.email,
      l.loan_date
    FROM loans l
    JOIN books b ON l.book_id = b.book_id
    JOIN members m ON l.member_id = m.member_id
    WHERE l.returned = 0
  `);

  const loans = stmt.all();

  res.json(loans);
});

//get loan history for a specific book
router.get('/book/:id', (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare(`
    SELECT 
      l.loan_id,
      m.name,
      l.loan_date,
      l.return_date,
      l.returned
    FROM loans l
    JOIN members m ON l.member_id = m.member_id
    WHERE l.book_id = ?
  `);

  const history = stmt.all(id);
  res.json(history);
});

export default router;
