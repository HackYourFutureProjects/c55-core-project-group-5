import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./data/book_library.db');

console.log('Connected to database');

const schemaPath = './data/books_library.sql';

if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

export default db;