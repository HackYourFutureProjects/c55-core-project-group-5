import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

import axios from 'axios';
import {
  splitAuthorName,
  normalizeBook,
  fetchBookByTitle,
} from '../src/apilibrary.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('splitAuthorName', () => {
  it('splits first and last name', () => {
    const result = splitAuthorName('J. R. R. Tolkien');

    expect(result).toEqual({
      firstName: 'J.',
      lastName: 'R. R. Tolkien',
    });
  });

  it('returns default values for empty string', () => {
    const result = splitAuthorName('');

    expect(result).toEqual({
      firstName: 'Unknown',
      lastName: 'Author',
    });
  });

  it('handles one-word author name', () => {
    const result = splitAuthorName('Plato');

    expect(result).toEqual({
      firstName: 'Plato',
      lastName: 'Unknown',
    });
  });
});

describe('normalizeBook', () => {
  it('returns clean book object', () => {
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

  it('returns fallback values when fields are missing', () => {
    const result = normalizeBook({});

    expect(result).toEqual({
      title: null,
      authorName: 'Unknown Author',
      publicationYear: null,
      isbn: null,
    });
  });
});

describe('fetchBookByTitle', () => {
  it('returns normalized book from Open Library', async () => {
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

    const result = await fetchBookByTitle('The Hobbit');

    expect(axios.get).toHaveBeenCalledWith(
      'https://openlibrary.org/search.json',
      {
        params: {
          title: 'The Hobbit',
          limit: 1,
          fields: 'title,author_name,first_publish_year,isbn',
        },
        timeout: 10000,
      }
    );

    expect(result).toEqual({
      title: 'The Hobbit',
      authorName: 'J. R. R. Tolkien',
      publicationYear: 1937,
      isbn: '9780261103344',
    });
  });

  it('returns null when no books are found', async () => {
    axios.get.mockResolvedValue({
      data: {
        docs: [],
      },
    });

    const result = await fetchBookByTitle('Some Unknown Book');

    expect(result).toBeNull();
  });

  it('throws if axios request fails', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    await expect(fetchBookByTitle('The Hobbit')).rejects.toThrow('Network error');
  });
});