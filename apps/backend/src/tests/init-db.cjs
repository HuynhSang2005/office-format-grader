const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Read the SQL file
const sql = fs.readFileSync('./init-db.sql', 'utf8');

// Create or open the database
const db = new sqlite3.Database('./dev.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Run the SQL commands
db.serialize(() => {
  db.exec(sql, (err) => {
    if (err) {
      console.error('Error executing SQL:', err);
    } else {
      console.log('Database initialized successfully.');
    }
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database connection closed.');
  }
});