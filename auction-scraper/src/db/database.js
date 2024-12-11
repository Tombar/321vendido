const sqlite3 = require('sqlite3').verbose();
const { databasePath } = require('../config');

const db = new sqlite3.Database(databasePath);

db.serialize(() => {
  console.log('Setting up the database...');
  db.exec(require('fs').readFileSync('src/db/schema.sql', 'utf-8'));
});

// Helper function to sanitize strings
const sanitizeString = (str) => {
  if (!str) return str;
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim();
};

const insertRemate = (site, title, description, startDate, endDate, url, location, rematadorId, casaRematesId) =>
  new Promise((resolve, reject) => {
    const query = `
      INSERT OR REPLACE INTO remates (
        site, title, description, start_date, end_date, url, 
        location, rematador_id, casa_remates_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    db.run(
      query, 
      [
        sanitizeString(site),
        sanitizeString(title),
        sanitizeString(description),
        startDate,
        endDate,
        sanitizeString(url),
        sanitizeString(location),
        rematadorId,
        casaRematesId
      ], 
      function (err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });

const insertItem = (remateId, lote, title, description, assets = []) =>
  new Promise((resolve, reject) => {
    // First insert the item
    const itemQuery = `
      INSERT OR REPLACE INTO items (remate_id, lote_id, title, description)
      VALUES (?, ?, ?, ?);
    `;
    
    db.serialize(() => {
      db.run(itemQuery, [
        remateId,
        lote,
        sanitizeString(title),
        sanitizeString(description)
      ], function (err) {
        if (err) {
          reject(err);
          return;
        }
        
        const itemId = this.lastID;
        
        // If we have assets, create asset records
        if (assets.length > 0) {
          const assetQuery = `
            INSERT INTO items_assets (item_id, asset_type, url)
            VALUES (?, ?, ?);
          `;
          
          // Create a transaction for inserting all assets
          db.run('BEGIN TRANSACTION');
          
          let completed = 0;
          let hasError = false;
          
          assets.forEach((asset) => {
            db.run(assetQuery, [
              itemId,
              asset.type || 'image',
              sanitizeString(asset.url)
            ], function (err) {
              completed++;
              
              if (err && !hasError) {
                hasError = true;
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              if (completed === assets.length && !hasError) {
                db.run('COMMIT');
                resolve(itemId);
              }
            });
          });
        } else {
          resolve(itemId);
        }
      });
    });
  });

const insertRematador = (name, type, contactInfo = null, website = null) =>
  new Promise((resolve, reject) => {
    const query = `
      INSERT OR REPLACE  INTO rematadores (name, type, contact_info, website)
      VALUES (?, ?, ?, ?);
    `;
    db.run(query, [
      sanitizeString(name),
      sanitizeString(type),
      sanitizeString(contactInfo),
      sanitizeString(website)
    ], function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });

module.exports = { db, insertRemate, insertItem, insertRematador };
