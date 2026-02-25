-- +goose Up
CREATE TABLE IF NOT EXISTS assets (
    immichID TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    originalFileName TEXT NOT NULL,
    fileCreatedAt TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    city TEXT,
    state TEXT,
    country TEXT,
    dateTimeOriginal TEXT,
    syncedAt TEXT NOT NULL DEFAULT (datetime('now')),
    stackID TEXT,
    stackPrimaryAssetID TEXT,
    stackAssetCount INTEGER
);

CREATE INDEX IF NOT EXISTS idx_no_gps ON assets(fileCreatedAt DESC)
    WHERE latitude IS NULL OR longitude IS NULL;

CREATE INDEX IF NOT EXISTS idx_date_with_gps ON assets(dateTimeOriginal)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE TABLE IF NOT EXISTS frequentLocations (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    label TEXT NOT NULL,
    assetCount INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS albums (
    immichID TEXT PRIMARY KEY,
    albumName TEXT NOT NULL,
    thumbnailAssetID TEXT,
    assetCount INTEGER NOT NULL DEFAULT 0,
    updatedAt TEXT NOT NULL,
    startDate TEXT
);

CREATE TABLE IF NOT EXISTS albumAssets (
    albumID TEXT REFERENCES albums(immichID) ON DELETE CASCADE,
    assetID TEXT,
    PRIMARY KEY (albumID, assetID)
);

CREATE INDEX IF NOT EXISTS idx_album_assets_asset ON albumAssets(assetID);

CREATE TABLE IF NOT EXISTS syncState (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- +goose Down
DROP TABLE IF EXISTS syncState;
DROP INDEX IF EXISTS idx_album_assets_asset;
DROP TABLE IF EXISTS albumAssets;
DROP TABLE IF EXISTS albums;
DROP TABLE IF EXISTS frequentLocations;
DROP INDEX IF EXISTS idx_date_with_gps;
DROP INDEX IF EXISTS idx_no_gps;
DROP TABLE IF EXISTS assets;
