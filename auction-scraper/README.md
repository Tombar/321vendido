# Auction Scraper

This project scrapes multiple auction sites and stores the data in a SQLite database.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with:
   ```
   DB_PATH=./data/auctions.db
   ```

3. Init the DB
   ```bash
   npm run init-db
   ```


## Run 

```
node src/main.js --sites siteA siteB
```

## Debug

```
DEBUG=pw:browser* node src/main.js --sites remotes --debug
```