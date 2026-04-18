import express from 'express';
import db from '../../data/db.js';

const router = express.Router();

//register member
router.post('/register', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Missing data' });

  try {
    const info = db
      .prepare('INSERT INTO members (name, email) VALUES (?, ?)')
      .run(name, email);
    res
      .status(201)
      .json({ member_id: info.lastInsertRowid, message: 'Member added' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists', err });
  }
});

//get all members
router.get('/', (req, res) => {
  const members = db.prepare('SELECT * FROM members').all();
  res.json(members);
});

//search member by email
router.get('/search', (req, res) => {
  const member = db
    .prepare('SELECT * FROM members WHERE email = ?')
    .get(req.query.email);
  member ? res.json(member) : res.status(404).json({ error: 'Not found' });
});

// get all loans for a specific member
router.get('/:id/loans', (req, res) => {
  const { id } = req.params;

  try {
    const loans = db
      .prepare(
        `
      SELECT 
        l.loan_id,
        b.title,
        l.loan_date,
        l.return_date,
        l.returned
      FROM loans l
      JOIN books b ON l.book_id = b.book_id
      WHERE l.member_id = ?
      ORDER BY l.loan_date DESC
    `
      )
      .all(id);

    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//deletee member
router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM members WHERE member_id = ?')
    .run(req.params.id);
  result.changes > 0
    ? res.json({ message: 'Deleted' })
    : res.status(404).json({ error: 'Not found' });
});

export default router;
