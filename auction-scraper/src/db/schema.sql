CREATE TABLE IF NOT EXISTS rematadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, 
    type TEXT NOT NULL CHECK(type IN ('casa_remates', 'martillero')), -- Type: 'auction_house' or 'auctioneer'
    contact_info TEXT, 
    website TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS remates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  url TEXT NOT NULL,
  rematador_id INTEGER,
  casa_remates_id INTEGER, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rematador_id) REFERENCES rematadores (id),
  FOREIGN KEY (casa_remates_id) REFERENCES rematadores (id),
  UNIQUE (url)
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  remate_id INTEGER,
  lote_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (remate_id) REFERENCES remates (id),
  UNIQUE (remate_id, lote_id)
);

CREATE TABLE IF NOT EXISTS items_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('image', 'video', 'document')),
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items (id)
);


