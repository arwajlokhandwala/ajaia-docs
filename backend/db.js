const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'ajaia.db');
const db = new DatabaseSync(DB_PATH);

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT NOT NULL DEFAULT '',
    owner_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS document_shares (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    shared_with_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, shared_with_id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Seed users if not present
const seedUsers = [
  { id: 'user-alice', email: 'alice@ajaia.com', name: 'Alice Chen', password: 'password123' },
  { id: 'user-bob',   email: 'bob@ajaia.com',   name: 'Bob Torres', password: 'password123' },
  { id: 'user-carol', email: 'carol@ajaia.com',  name: 'Carol Smith', password: 'password123' },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, email, name, password_hash)
  VALUES (?, ?, ?, ?)
`);

for (const u of seedUsers) {
  insertUser.run(u.id, u.email, u.name, bcrypt.hashSync(u.password, 10));
}

module.exports = db;
