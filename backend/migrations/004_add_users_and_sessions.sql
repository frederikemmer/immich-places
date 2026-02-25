-- +goose Up

CREATE TABLE users (
    ID TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    passwordHash TEXT NOT NULL,
    immichAPIKey TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE sessions (
    tokenHash TEXT PRIMARY KEY,
    userID TEXT NOT NULL REFERENCES users(ID) ON DELETE CASCADE,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_userID ON sessions(userID);
CREATE INDEX idx_sessions_expiresAt ON sessions(expiresAt);

ALTER TABLE assets ADD COLUMN userID TEXT REFERENCES users(ID) ON DELETE CASCADE;
ALTER TABLE albums ADD COLUMN userID TEXT REFERENCES users(ID) ON DELETE CASCADE;
ALTER TABLE frequentLocations ADD COLUMN userID TEXT REFERENCES users(ID) ON DELETE CASCADE;

CREATE TABLE syncState_new (
    userID TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (userID, key)
);
INSERT INTO syncState_new (userID, key, value) SELECT '', key, value FROM syncState;
DROP TABLE syncState;
ALTER TABLE syncState_new RENAME TO syncState;

-- +goose Down

ALTER TABLE syncState RENAME TO syncState_multi;
CREATE TABLE syncState (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
INSERT INTO syncState (key, value) SELECT key, value FROM syncState_multi WHERE userID = '';
DROP TABLE syncState_multi;

DROP INDEX IF EXISTS idx_sessions_expiresAt;
DROP INDEX IF EXISTS idx_sessions_userID;
DROP TABLE IF EXISTS sessions;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
