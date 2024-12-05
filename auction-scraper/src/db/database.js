const sqlite3 = require('sqlite3').verbose();
const { databasePath } = require('../config');

const db = new sqlite3.Database(databasePath);

db.serialize(() => {
  console.log('Setting up the database...');
  db.exec(require('fs').readFileSync('src/db/schema.sql', 'utf-8'));
});

const insertRemate = (site, title, description, startDate, endDate, url) =>
  new Promise((resolve, reject) => {
    const query = `
      INSERT OR REPLACE INTO remates (site, title, description, start_date, end_date, url)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    db.run(query, [site, title, description, startDate, endDate, url], function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });

const insertItem = (remateId, name, description, imageUrl) =>
  new Promise((resolve, reject) => {
    const query = `
      INSERT INTO items (remate_id, name, description, image_url)
      VALUES (?, ?, ?, ?);
    `;
    db.run(query, [remateId, name, description, imageUrl], function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });

module.exports = { db, insertRemate, insertItem };
