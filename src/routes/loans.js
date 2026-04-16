import express from 'express';
import db from '../../data/db.js';

const router = express.Router();

//


db.prepare(`
CREATE TABLE IF NOT EXISTS members (
  member_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS loans (
  loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  loan_date TEXT NOT NULL,
  return_date TEXT,
  returned INTEGER DEFAULT 0,
  FOREIGN KEY (book_id) REFERENCES books(book_id),
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);
`).run();

db.prepare(`
INSERT OR IGNORE INTO members (member_id, name, email)
VALUES (1, 'Test User', 'test@test.com');
`).run();

router.post('/', (req, res) => {
  const { book_id, member_id } = req.body;

  if (!book_id || !member_id) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const stmt = db.prepare(`
    INSERT INTO loans (book_id, member_id, loan_date)
    VALUES (?, ?, datetime('now'))
  `);

  const result = stmt.run(book_id, member_id);

  res.json({
    message: 'Book loaned successfully',
    loanId: result.lastInsertRowid
  });
});

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
    message: 'Book returned successfully'
  });
});

router.get('/', (req, res) => {
  const stmt = db.prepare(`
    SELECT 
      l.loan_id,
      b.title,
      m.name,
      l.loan_date
    FROM loans l
    JOIN books b ON l.book_id = b.book_id
    JOIN members m ON l.member_id = m.member_id
    WHERE l.returned = 0
  `);

  const loans = stmt.all();

  res.json(loans);
});

export default router;
router.get('/', (req, res) => {
  const stmt = db.prepare(`
    SELECT 
      l.loan_id,
      b.title,
      m.name,
      l.loan_date
    FROM loans l
    JOIN books b ON l.book_id = b.book_id
    JOIN members m ON l.member_id = m.member_id
    WHERE l.returned = 0
  `);

  const loans = stmt.all();
  res.json(loans);
});
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