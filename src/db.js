import Database from 'better-sqlite3';

const db = new Database('./book_library.db');

console.log('Connected to SQLite database');

export default db;