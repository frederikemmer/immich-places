-- +goose Up
CREATE INDEX IF NOT EXISTS idx_assets_page_position ON assets(userID, fileCreatedAt DESC, immichID DESC)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND stackPrimaryAssetID IS NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_assets_page_position;
