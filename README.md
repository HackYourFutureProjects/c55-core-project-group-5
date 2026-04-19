# Group 5: Library management system

A starter project for the Core program final project:
  
https://hub.hackyourfuture.nl/core-program-week-14

## Overview

This project is a simple library management system built with:

- Node.js
- Express
- Better-SQLite3
- HTML/CSS/JavaScript frontend

The application allows users to:

- browse the library catalog
- register and log in as a library member
- borrow books
- return books
- view active loans
- import books from Open Library API
- generate a short AI teaser for a book

## Features

### Library catalog
The website displays the list of books stored in the SQLite database.

### Member management
Users can create an account and log in using their email address.

### Borrow and return books
A logged-in member can borrow an available book and return it later.

### Open Library integration
Books can be searched and imported from Open Library into the local database.

### AI teaser
The system can generate a short teaser/insight for a selected book using an LLM.

## Project structure

```text
c55-core-project-group-5/
│
├── data/
│   ├── book_library.db
│   ├── books_library.sql
│   └── db.js
│
├── public/
│   └── index.html
│
├── src/
│   ├── index.js
│   ├── apilibrary.js
│   ├── llm_helper.js
│   └── routes/
│       ├── books.js
│       ├── members.js
│       └── loans.js
│
├── tests/
│   └── apilibrary.test.js
│
├── package.json
└── README.md
```

## Setup

1. Clone the repository
    git clone <repository-url>
    cd c55-core-project-group-5
2. Run `npm install` to install dependencies
3. Configure environment variables
    Create a .env file in the project root:
        OPENAI_API_KEY=your_openai_api_key_here
4. Run `npm start` to run the application
    The app should run at:
        http://localhost:3000

## Code quality
- Run `npm run lint` to check for linting errors
- Run `npm run format` to format the code with Prettier

## Tests
Run `npm test` to run the tests

## Database
    The project uses SQLite.

    Main database file:
        data/book_library.db
    
    Main tables used in the project:
        authors
        books
        members
        loans

    The database connection is handled in:
        data/db.js

## Open Library integration
    The project uses Open Library to search for book metadata before importing a book into the local database.

    Imported fields typically include:
        title
        author
        publication year
        ISBN

## Authors
    Group 5
        Halyna, Mustafa, Bader, Baraah 