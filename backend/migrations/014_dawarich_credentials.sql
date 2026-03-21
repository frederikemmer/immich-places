-- +goose Up
ALTER TABLE users ADD COLUMN dawarichAPIKey TEXT;

-- +goose Down
-- SQLite does not support DROP COLUMN in older versions
