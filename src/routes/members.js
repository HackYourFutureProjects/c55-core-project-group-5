import express from 'express';
import db from '../../data/db.js';

const router = express.Router();

//register member
router.post('/register', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res
      .status(400)
      .json({ error: 'Please provide both name and email.' });

  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  if (!nameRegex.test(name.trim())) {
    return res.status(400).json({
      error: 'Invalid Name. Use only letters and spaces (2-50 characters).',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();

    const existingMember = db
      .prepare('SELECT email FROM members WHERE email = ?')
      .get(normalizedEmail);
    if (existingMember) {
      return res
        .status(409)
        .json({ error: 'This email is already registered.' });
    }

    const stmt = db.prepare('INSERT INTO members (name, email) VALUES (?, ?)');
    const info = stmt.run(normalizedName, normalizedEmail);

    res.status(201).json({
      message: 'Member registered successfully',
      member_id: info.lastInsertRowid,
    });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res
      .status(500)
      .json({ error: 'Internal server error. Please try again later.' });
  }
});

//get all members
router.get('/', (req, res) => {
  const members = db.prepare('SELECT * FROM members').all();
  res.json(members);
});

//search member by email
router.get('/search', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const member = db
      .prepare('SELECT * FROM members WHERE email = ?')
      .get(normalizedEmail);

    if (member) {
      res.json(member);
    } else {
      res.status(404).json({ error: 'Member not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

//delete member and their loan history
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const deleteMemberTransaction = db.transaction((memberId) => {
    db.prepare('DELETE FROM loans WHERE member_id = ?').run(memberId);
    return db.prepare('DELETE FROM members WHERE member_id = ?').run(memberId);
  });

  try {
    const info = deleteMemberTransaction(id);

    if (info.changes > 0) {
      res.json({ message: 'Member and their loan history deleted.' });
    } else {
      res.status(404).json({ error: 'Member not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
