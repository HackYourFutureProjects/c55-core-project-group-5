CREATE TABLE authors (
    author_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
);

CREATE TABLE books (
    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    isbn TEXT UNIQUE NOT NULL,
    author_id INTEGER NOT NULL,
    publication_year INTEGER,
    genre TEXT,
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
);