require('dotenv').config();

module.exports = {
  databasePath: process.env.DB_PATH || './data/auctions.db',
  playwrightOptions: {
    headless: true, // Change to `false` for debugging
  },
};
