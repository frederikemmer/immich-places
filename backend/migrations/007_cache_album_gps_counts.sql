-- +goose Up
ALTER TABLE albums ADD COLUMN gpsCount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE albums ADD COLUMN noGPSCount INTEGER NOT NULL DEFAULT 0;

-- Backfill cached counts for all existing albums
UPDATE albums SET
    gpsCount = (
        SELECT COUNT(*)
        FROM albumAssets aa
        JOIN assets ast ON ast.userID = aa.userID AND ast.immichID = aa.assetID
        WHERE aa.userID = albums.userID AND aa.albumID = albums.immichID
            AND ast.latitude IS NOT NULL AND ast.longitude IS NOT NULL
            AND ast.stackPrimaryAssetID IS NULL
    ),
    noGPSCount = (
        SELECT COUNT(*)
        FROM albumAssets aa
        JOIN assets ast ON ast.userID = aa.userID AND ast.immichID = aa.assetID
        WHERE aa.userID = albums.userID AND aa.albumID = albums.immichID
            AND (ast.latitude IS NULL OR ast.longitude IS NULL)
            AND ast.stackPrimaryAssetID IS NULL
    );

-- +goose Down
ALTER TABLE albums DROP COLUMN gpsCount;
ALTER TABLE albums DROP COLUMN noGPSCount;
