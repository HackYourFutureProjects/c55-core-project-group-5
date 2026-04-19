import { describe, expect, test, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import db from '../data/db.js';

describe('Member API', () => {
  const TEST_EMAIL = 'test-member@example.local';

  afterEach(() => {
    db.prepare(
      `
      DELETE FROM loans 
      WHERE member_id IN (SELECT member_id FROM members WHERE email = ?)
    `
    ).run(TEST_EMAIL);

    db.prepare('DELETE FROM members WHERE email = ?').run(TEST_EMAIL);
  });
  // code above is saftey
  test('Register a new member', async () => {
    const res = await request(app)
      .post('/members/register')
      .send({ name: 'Test User', email: TEST_EMAIL });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Member registered successfully');
  });

  test('Search member by email', async () => {
    db.prepare('INSERT INTO members (name, email) VALUES (?, ?)').run(
      'Search Test',
      TEST_EMAIL
    );

    const res = await request(app)
      .get('/members/search')
      .query({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_EMAIL);
  });

  test('Register duplicate email should fail', async () => {
    db.prepare('INSERT INTO members (name, email) VALUES (?, ?)').run(
      'Dup User',
      TEST_EMAIL
    );

    const res = await request(app)
      .post('/members/register')
      .send({ name: 'Dup User', email: TEST_EMAIL });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This email is already registered.');
  });

  test('Register fails with missing data', async () => {
    const res = await request(app)
      .post('/members/register')
      .send({ name: 'No Email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please provide both name and email.');
  });

  test('Delete an existing member', async () => {
    db.prepare('INSERT INTO members (name, email) VALUES (?, ?)').run(
      'Delete Test',
      TEST_EMAIL
    );

    const member = db
      .prepare('SELECT member_id FROM members WHERE email = ?')
      .get(TEST_EMAIL);

    const res = await request(app).delete(`/members/${member.member_id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Member and their loan history deleted.');
  });
});
