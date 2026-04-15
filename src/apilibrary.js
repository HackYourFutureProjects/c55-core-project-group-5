import axios from 'axios';

function splitAuthorName(fullName = 'Unknown Author') {
  const clean = fullName.trim();

  if (!clean) {
    return { firstName: 'Unknown', lastName: 'Author' };
  }

  const parts = clean.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Unknown' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function normalizeBook(doc) {
  return {
    title: doc?.title?.trim() || null,
    authorName:
      Array.isArray(doc?.author_name) && doc.author_name[0]
        ? doc.author_name[0].trim()
        : 'Unknown Author',
    publicationYear: Number.isInteger(doc?.first_publish_year)
      ? doc.first_publish_year
      : null,
    isbn:
      Array.isArray(doc?.isbn) && doc.isbn[0]
        ? String(doc.isbn[0]).trim()
        : null,
  };
}

async function fetchBookByTitle(title) {
  const response = await axios.get('https://openlibrary.org/search.json', {
    params: {
      title,
      limit: 1,
      fields: 'title,author_name,first_publish_year,isbn',
    },
    timeout: 10000,
  });

  const docs = response.data?.docs;

  if (!docs || docs.length === 0) {
    return null;
  }

  return normalizeBook(docs[0]);
}

export { splitAuthorName, normalizeBook, fetchBookByTitle };