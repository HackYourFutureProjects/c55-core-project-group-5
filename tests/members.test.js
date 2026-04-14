import { describe, expect, test, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import db from '../data/db.js';

describe('Member API', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM members').run();
  });

  test('Register a new member', async () => {
    const res = await request(app)
      .post('/members/register')
      .send({ name: 'Test User', email: 'test@test.com' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('member_id');
  });

  test('Delete an existing member', async () => {
    const info = db
      .prepare('INSERT INTO members (name, email) VALUES (?, ?)')
      .run('Delete Me', 'delete@test.com');

    const res = await request(app).delete(`/members/${info.lastInsertRowid}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Deleted');
  });

  test('Search member by email', async () => {
    db.prepare('INSERT INTO members (name, email) VALUES (?, ?)').run(
      'Search Test',
      'find@me.com'
    );

    const res = await request(app)
      .get('/members/search')
      .query({ email: 'find@me.com' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Search Test');
  });
});
