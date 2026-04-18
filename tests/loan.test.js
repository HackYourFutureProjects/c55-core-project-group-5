//import request from 'supertest';
//import app from '../src/index.js';

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Loans API', () => {

  it('should get loans list', async () => {
    const res = await request(app).get('/loans');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get loan history for a book', async () => {
    const res = await request(app).get('/loans/book/9');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

});