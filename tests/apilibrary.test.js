import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 1. Мокаємо axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// 2. Мокаємо db
vi.mock('../data/db.js', () => ({
  default: {
    prepare: vi.fn(),
    transaction: vi.fn((fn) => fn),
  },
}));

import axios from 'axios';
import db from '../data/db.js';
import app, {
  splitAuthorName,
  normalizeBook,
} from '../src/apilibrary.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('helper functions', () => {
  it('splitAuthorName splits first and last name', () => {
    const result = splitAuthorName('J. R. R. Tolkien');

    expect(result).toEqual({
      firstName: 'J.',
      lastName: 'R. R. Tolkien',
    });
  });

  it('normalizeBook returns clean book object', () => {
    const result = normalizeBook({
      title: ' The Hobbit ',
      author_name: ['J. R. R. Tolkien'],
      first_publish_year: 1937,
      isbn: ['9780261103344'],
    });

    expect(result).toEqual({
      title: 'The Hobbit',
      authorName: 'J. R. R. Tolkien',
      publicationYear: 1937,
      isbn: '9780261103344',
    });
  });
});

describe('GET /', () => {
  it('returns API info', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Books API is running');
    expect(response.body.endpoints.allBooks).toBe('GET /books');
  });
});

describe('GET /books', () => {
  it('returns books from database', async () => {
    db.prepare.mockReturnValue({
      all: vi.fn().mockReturnValue([
        {
          book_id: 1,
          title: 'The Hobbit',
          isbn: '9780261103344',
          publication_year: 1937,
          genre: 'Fantasy',
          author_id: 1,
          first_name: 'J.',
          last_name: 'R. R. Tolkien',
        },
      ]),
    });

    const response = await request(app).get('/books');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('The Hobbit');
  });
});

describe('GET /books/search', () => {
  it('returns 400 if title is missing', async () => {
    const response = await request(app).get('/books/search');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Query parameter "title" is required');
  });

  it('returns a book from Open Library', async () => {
    axios.get.mockResolvedValue({
      data: {
        docs: [
          {
            title: 'The Hobbit',
            author_name: ['J. R. R. Tolkien'],
            first_publish_year: 1937,
            isbn: ['9780261103344'],
          },
        ],
      },
    });

    const response = await request(app).get('/books/search?title=The Hobbit');

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('The Hobbit');
    expect(response.body.authorName).toBe('J. R. R. Tolkien');
  });
});

describe('POST /books/import', () => {
  it('imports a book successfully', async () => {
    axios.get.mockResolvedValue({
      data: {
        docs: [
          {
            title: 'The Hobbit',
            author_name: ['J. R. R. Tolkien'],
            first_publish_year: 1937,
            isbn: ['9780261103344'],
          },
        ],
      },
    });

    db.prepare
      // SELECT author_id ...
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue(undefined),
      })
      // INSERT INTO authors ...
      .mockReturnValueOnce({
        run: vi.fn().mockReturnValue({ lastInsertRowid: 5 }),
      })
      // SELECT book_id FROM books WHERE isbn = ?
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue(undefined),
      })
      // INSERT INTO books ...
      .mockReturnValueOnce({
        run: vi.fn().mockReturnValue({ lastInsertRowid: 10 }),
      });

    const response = await request(app)
      .post('/books/import')
      .send({
        title: 'The Hobbit',
        genre: 'Fantasy',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Book imported successfully');
    expect(response.body.book.title).toBe('The Hobbit');
    expect(response.body.book.author_id).toBe(5);
  });
});