const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load schema file
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Define database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/auctions.db');

// Initialize the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

// Create tables using the schema
db.serialize(() => {
  console.log('Initializing database...');
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database:', err.message);
      process.exit(1);
    }
    console.log('Database initialized successfully.');
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
});
