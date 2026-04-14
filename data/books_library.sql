CREATE TABLE authors (
    author_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
    author_id INTEGER REFERENCES authors(id)
    INSERT INTO authors (first_name, last_name) VALUES ("J.K.", "Rowling");
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

INSERT INTO authors (first_name, last_name)
VALUES ('George', 'Orwell');

INSERT INTO books (title, isbn, author_id, publication_year, genre)
VALUES ('1984', '9780451524935', 1, 1949, 'Dystopian');

SELECT
    b.book_id,
    b.title,
    b.isbn,
    a.first_name,
    a.last_name,
    b.publication_year,
    b.genre
FROM books b
JOIN authors a ON b.author_id = a.author_id
ORDER BY b.title;

UPDATE books
SET genre = 'Classic dystopian fiction'
WHERE book_id = 1;

DELETE FROM books
WHERE book_id = 1;