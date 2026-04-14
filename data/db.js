import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath = './data/book_library.db';

if (!fs.existsSync(dbPath)) {
  console.log('Database file not found:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

console.log('Connected to database:', dbPath);

export default db;