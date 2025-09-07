-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Create grade_results table
CREATE TABLE IF NOT EXISTS grade_results (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  filename TEXT NOT NULL,
  fileType TEXT NOT NULL,
  totalPoints REAL NOT NULL,
  byCriteria TEXT NOT NULL,
  gradedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create custom_rubrics table
CREATE TABLE IF NOT EXISTS custom_rubrics (
  id TEXT PRIMARY KEY,
  ownerId INTEGER NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  total REAL NOT NULL,
  isPublic BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create ungraded_files table
CREATE TABLE IF NOT EXISTS ungraded_files (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  filename TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert initial users
INSERT OR IGNORE INTO users (id, email, password) VALUES 
(1, 'admin@example.com', '$2a$10$8K1p/a0dURXAm7QiTRqUzuN0/SpuDMaM3O9n8Ko74Q0OJ0EGHn6pO'),
(2, 'teacher@example.com', '$2a$10$8K1p/a0dURXAm7QiTRqUzuN0/SpuDMaM3O9n8Ko74Q0OJ0EGHn6pO'),
(3, 'student@example.com', '$2a$10$8K1p/a0dURXAm7QiTRqUzuN0/SpuDMaM3O9n8Ko74Q0OJ0EGHn6pO'),
(4, 'test@example.com', '$2a$10$8K1p/a0dURXAm7QiTRqUzuN0/SpuDMaM3O9n8Ko74Q0OJ0EGHn6pO');