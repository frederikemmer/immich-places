-- +goose Up
CREATE INDEX IF NOT EXISTS idx_gps_assets ON assets(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND stackPrimaryAssetID IS NULL;

CREATE INDEX IF NOT EXISTS idx_stack_id ON assets(stackID)
    WHERE stackID IS NOT NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_stack_id;
DROP INDEX IF EXISTS idx_gps_assets;
