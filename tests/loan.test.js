import { describe, expect, test, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import db from '../data/db.js';

describe('Loans API', () => {
  const TEST_EMAIL = 'loan-test@example.local';

  afterEach(() => {
    db.prepare(
      `DELETE FROM loans WHERE member_id IN (SELECT member_id FROM members WHERE email = ?)`
  ).run(TEST_EMAIL);

    db.prepare(`
      DELETE FROM books WHERE title LIKE 'Test Book%'`).run();

    db.prepare(`
      DELETE FROM authors WHERE first_name = 'Test'`).run();

    db.prepare('DELETE FROM members WHERE email = ?')
      .run(TEST_EMAIL);
  });


  // create new loan
  test('Create a new loan', async () => {
    const member = db.prepare(
      'INSERT INTO members (name, email) VALUES (?, ?)'
    ).run('Loan User', TEST_EMAIL);

    const author = db.prepare(
      'INSERT INTO authors (first_name, last_name) VALUES (?, ?)'
    ).run('Test', 'Author');

    const book = db.prepare(`
      INSERT INTO books (title, isbn ,author_id)
      VALUES (?, ?, ?)
    `).run('Test Book 1', '1234567890', author.lastInsertRowid);

    const res = await request(app)
      .post('/loans')
      .send({
        member_id: member.lastInsertRowid,
        book_id: book.lastInsertRowid
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Book loaned successfully');
  });


  // can not loan same book twice
  test('Should not loan same book twice', async () => {
    const member = db.prepare(
      'INSERT INTO members (name, email) VALUES (?, ?)'
    ).run('Loan User 2', TEST_EMAIL);

    const author = db.prepare(
      'INSERT INTO authors (first_name, last_name) VALUES (?, ?)'
    ).run('Test', 'Author');

    const book = db.prepare(`
      INSERT INTO books (title,isbn, author_id)
      VALUES (?, ?,?)
    `).run('Test Book 2','123456789' ,author.lastInsertRowid);

    // first loan try
    await request(app).post('/loans').send({
      member_id: member.lastInsertRowid,
      book_id: book.lastInsertRowid
    });

    // second loan try
    const res = await request(app).post('/loans').send({
      member_id: member.lastInsertRowid,
      book_id: book.lastInsertRowid
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This book is already loaned.');
  });

test('Should get active loans list ', async () => {
  const res = await request(app).get('/loans');

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('Should fail loan if member does not exist (not logged in)', async () => {
  const res = await request(app)
    .post('/loans')
    .send({
      member_id: 999999,
      book_id: 1
    });

  expect(res.status).toBe(404);
});

test('Should show loan in active loans after borrowing', async () => {
    const member = db.prepare(
      'INSERT INTO members (name, email) VALUES (?, ?)'
    ).run('Loan User', TEST_EMAIL);

    const author = db.prepare(
      'INSERT INTO authors (first_name, last_name) VALUES (?, ?)'
    ).run('Test', 'Author');

    const book = db.prepare(
      'INSERT INTO books (title, isbn, author_id) VALUES (?, ?, ?)'
    ).run('Test Book A', '1122334455', author.lastInsertRowid);

    await request(app)
      .post('/loans')
      .send({ member_id: member.lastInsertRowid, book_id: book.lastInsertRowid });

    const res = await request(app).get('/loans');
    const found = res.body.some(l => l.title === 'Test Book A');

    expect(res.status).toBe(200);
    expect(found).toBe(true);
  });
test('Should not show returned loan in active loans', async () => {
    const member = db.prepare(
      'INSERT INTO members (name, email) VALUES (?, ?)'
    ).run('Loan User', TEST_EMAIL);

    const author = db.prepare(
      'INSERT INTO authors (first_name, last_name) VALUES (?, ?)'
    ).run('Test', 'Author');

    const book = db.prepare(
      'INSERT INTO books (title, isbn, author_id) VALUES (?, ?, ?)'
    ).run('Test Book B', '9988776655', author.lastInsertRowid);

    const loanRes = await request(app)
      .post('/loans')
      .send({ member_id: member.lastInsertRowid, book_id: book.lastInsertRowid });

    await request(app).patch(`/loans/return/${loanRes.body.loan_id}`);

    const res = await request(app).get('/loans');
    const found = res.body.some(l => l.title === 'Test Book B');

    expect(res.status).toBe(200);
    expect(found).toBe(false);
  });
  test('Should return empty array for member with no loans', async () => {
  const member = db.prepare(
    'INSERT INTO members (name, email) VALUES (?, ?)'
  ).run('Loan User', TEST_EMAIL);

  const res = await request(app)
    .get(`/members/${member.lastInsertRowid}/loans`);

  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

});
