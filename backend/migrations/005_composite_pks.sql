-- +goose Up

-- Preserve albumAssets data for later restoration
DROP INDEX IF EXISTS idx_album_assets_asset;
ALTER TABLE albumAssets RENAME TO albumAssets_old;

-- Preserve legacy single-user data: create placeholder user if orphaned rows exist
INSERT OR IGNORE INTO users (ID, email, passwordHash)
SELECT '__legacy__', '__legacy__', '__placeholder__'
WHERE EXISTS (SELECT 1 FROM assets WHERE userID IS NULL)
  AND NOT EXISTS (SELECT 1 FROM users);

UPDATE assets SET userID = (SELECT ID FROM users LIMIT 1) WHERE userID IS NULL;
UPDATE albums SET userID = (SELECT ID FROM users LIMIT 1) WHERE userID IS NULL;
UPDATE frequentLocations SET userID = (SELECT ID FROM users LIMIT 1) WHERE userID IS NULL;

-- Recreate assets with composite PK (userID, immichID)
CREATE TABLE assets_new (
    userID TEXT NOT NULL REFERENCES users(ID) ON DELETE CASCADE,
    immichID TEXT NOT NULL,
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
    stackAssetCount INTEGER,
    PRIMARY KEY (userID, immichID)
);

INSERT INTO assets_new (userID, immichID, type, originalFileName, fileCreatedAt,
    latitude, longitude, city, state, country, dateTimeOriginal, syncedAt,
    stackID, stackPrimaryAssetID, stackAssetCount)
SELECT userID, immichID, type, originalFileName, fileCreatedAt,
    latitude, longitude, city, state, country, dateTimeOriginal, syncedAt,
    stackID, stackPrimaryAssetID, stackAssetCount
FROM assets WHERE userID IS NOT NULL;

DROP TABLE assets;
ALTER TABLE assets_new RENAME TO assets;

CREATE INDEX idx_assets_no_gps ON assets(userID, fileCreatedAt DESC)
    WHERE latitude IS NULL OR longitude IS NULL;
CREATE INDEX idx_assets_with_gps ON assets(userID, dateTimeOriginal)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_assets_stack ON assets(userID, stackID)
    WHERE stackID IS NOT NULL;

-- Recreate albums with composite PK (userID, immichID)
CREATE TABLE albums_new (
    userID TEXT NOT NULL REFERENCES users(ID) ON DELETE CASCADE,
    immichID TEXT NOT NULL,
    albumName TEXT NOT NULL,
    thumbnailAssetID TEXT,
    assetCount INTEGER NOT NULL DEFAULT 0,
    updatedAt TEXT NOT NULL,
    startDate TEXT,
    PRIMARY KEY (userID, immichID)
);

INSERT INTO albums_new (userID, immichID, albumName, thumbnailAssetID, assetCount, updatedAt, startDate)
SELECT userID, immichID, albumName, thumbnailAssetID, assetCount, updatedAt, startDate
FROM albums WHERE userID IS NOT NULL;

DROP TABLE albums;
ALTER TABLE albums_new RENAME TO albums;

-- Recreate albumAssets with userID
CREATE TABLE albumAssets (
    userID TEXT NOT NULL,
    albumID TEXT NOT NULL,
    assetID TEXT NOT NULL,
    PRIMARY KEY (userID, albumID, assetID),
    FOREIGN KEY (userID, albumID) REFERENCES albums(userID, immichID) ON DELETE CASCADE
);

CREATE INDEX idx_album_assets_asset ON albumAssets(userID, assetID);

-- Restore albumAssets data, deriving userID from the album owner
INSERT INTO albumAssets (userID, albumID, assetID)
SELECT a.userID, old.albumID, old.assetID
FROM albumAssets_old old
JOIN albums a ON a.immichID = old.albumID;

DROP TABLE albumAssets_old;

-- Recreate frequentLocations with NOT NULL userID
CREATE TABLE frequentLocations_new (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    userID TEXT NOT NULL REFERENCES users(ID) ON DELETE CASCADE,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    label TEXT NOT NULL,
    assetCount INTEGER NOT NULL DEFAULT 0
);

INSERT INTO frequentLocations_new (userID, latitude, longitude, label, assetCount)
SELECT userID, latitude, longitude, label, assetCount
FROM frequentLocations WHERE userID IS NOT NULL;

DROP TABLE frequentLocations;
ALTER TABLE frequentLocations_new RENAME TO frequentLocations;

-- +goose Down

-- Revert to single-column PKs
DROP INDEX IF EXISTS idx_album_assets_asset;
ALTER TABLE albumAssets RENAME TO albumAssets_old;

CREATE TABLE assets_old (
    immichID TEXT PRIMARY KEY,
    userID TEXT REFERENCES users(ID) ON DELETE CASCADE,
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
INSERT OR IGNORE INTO assets_old SELECT immichID, userID, type, originalFileName, fileCreatedAt,
    latitude, longitude, city, state, country, dateTimeOriginal, syncedAt,
    stackID, stackPrimaryAssetID, stackAssetCount
FROM assets;
DROP TABLE assets;
ALTER TABLE assets_old RENAME TO assets;

CREATE INDEX idx_no_gps ON assets(fileCreatedAt DESC)
    WHERE latitude IS NULL OR longitude IS NULL;
CREATE INDEX idx_date_with_gps ON assets(dateTimeOriginal)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE TABLE albums_old (
    immichID TEXT PRIMARY KEY,
    userID TEXT REFERENCES users(ID) ON DELETE CASCADE,
    albumName TEXT NOT NULL,
    thumbnailAssetID TEXT,
    assetCount INTEGER NOT NULL DEFAULT 0,
    updatedAt TEXT NOT NULL,
    startDate TEXT
);
INSERT OR IGNORE INTO albums_old SELECT immichID, userID, albumName, thumbnailAssetID, assetCount, updatedAt, startDate
FROM albums;
DROP TABLE albums;
ALTER TABLE albums_old RENAME TO albums;

CREATE TABLE albumAssets (
    albumID TEXT REFERENCES albums(immichID) ON DELETE CASCADE,
    assetID TEXT,
    PRIMARY KEY (albumID, assetID)
);
CREATE INDEX idx_album_assets_asset ON albumAssets(assetID);

INSERT OR IGNORE INTO albumAssets (albumID, assetID)
SELECT albumID, assetID FROM albumAssets_old;

DROP TABLE albumAssets_old;

CREATE TABLE frequentLocations_old (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    userID TEXT REFERENCES users(ID) ON DELETE CASCADE,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    label TEXT NOT NULL,
    assetCount INTEGER NOT NULL DEFAULT 0
);
INSERT INTO frequentLocations_old SELECT ID, userID, latitude, longitude, label, assetCount
FROM frequentLocations;
DROP TABLE frequentLocations;
ALTER TABLE frequentLocations_old RENAME TO frequentLocations;
