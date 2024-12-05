CREATE TABLE IF NOT EXISTS remates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site TEXT NOT NULL,
  title TEXT,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  url TEXT,
  rematador_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (url)
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  remate_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  FOREIGN KEY (remate_id) REFERENCES remates (id)
  -- UNIQUE ()
);

CREATE TABLE IF NOT EXISTS rematadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- Name of the auction house or auctioneer
    type TEXT NOT NULL CHECK(type IN ('casa_remates', 'martillero')), -- Type: 'auction_house' or 'auctioneer'
    contact_info TEXT, -- Optional contact information (e.g., phone, email)
    website TEXT, -- Optional website link
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of record creation
);
