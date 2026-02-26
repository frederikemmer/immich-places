package main

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

// refreshAlbumGPSCountsSQL updates the cached gpsCount and noGPSCount for a single album.
// Args: userID, albumID (for gpsCount subquery), userID, albumID (for noGPSCount subquery), userID, albumID (WHERE clause).
const refreshAlbumGPSCountsSQL = `
UPDATE albums SET
	gpsCount = (
		SELECT COUNT(*)
		FROM albumAssets aa
		JOIN assets ast ON ast.userID = aa.userID AND ast.immichID = aa.assetID
		WHERE aa.userID = ? AND aa.albumID = ?
			AND ast.latitude IS NOT NULL AND ast.longitude IS NOT NULL
			AND ast.stackPrimaryAssetID IS NULL
	),
	noGPSCount = (
		SELECT COUNT(*)
		FROM albumAssets aa
		JOIN assets ast ON ast.userID = aa.userID AND ast.immichID = aa.assetID
		WHERE aa.userID = ? AND aa.albumID = ?
			AND (ast.latitude IS NULL OR ast.longitude IS NULL)
			AND ast.stackPrimaryAssetID IS NULL
	)
WHERE userID = ? AND immichID = ?`

func (d *Database) getAlbumUpdatedAt(ctx context.Context, userID, albumID string) (string, error) {
	var updatedAt string
	err := d.db.QueryRowContext(ctx, "SELECT updatedAt FROM albums WHERE userID = ? AND immichID = ?", userID, albumID).Scan(&updatedAt)
	return updatedAt, err
}

func (d *Database) getAlbumUpdatedAtMap(ctx context.Context, userID string) (map[string]string, error) {
	result := make(map[string]string)
	rows, err := d.db.QueryContext(ctx, "SELECT immichID, updatedAt FROM albums WHERE userID = ?", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query album updatedAt: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var id, updatedAt string
		if err := rows.Scan(&id, &updatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan album updatedAt: %w", err)
		}
		result[id] = updatedAt
	}
	return result, rows.Err()
}

func (d *Database) upsertAlbum(ctx context.Context, userID, albumID, albumName string, thumbnailAssetID *string, assetCount int, updatedAt string, startDate *string) error {
	_, err := d.db.ExecContext(ctx,
		`INSERT INTO albums (immichID, userID, albumName, thumbnailAssetID, assetCount, updatedAt, startDate)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(userID, immichID) DO UPDATE SET
			albumName = excluded.albumName,
			thumbnailAssetID = excluded.thumbnailAssetID,
			assetCount = excluded.assetCount,
			updatedAt = excluded.updatedAt,
			startDate = excluded.startDate`,
		albumID, userID, albumName, thumbnailAssetID, assetCount, updatedAt, startDate,
	)
	return err
}

func (d *Database) replaceAlbumAssets(ctx context.Context, userID, albumID string, assetIDs []string) error {
	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := bulkInsertTemp(ctx, tx, "tmpDesiredAssets", assetIDs); err != nil {
		return fmt.Errorf("populate temp table: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`DELETE FROM albumAssets WHERE userID = ? AND albumID = ? AND assetID NOT IN (SELECT val FROM tmpDesiredAssets)`,
		userID, albumID,
	); err != nil {
		return fmt.Errorf("delete stale album assets: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`INSERT INTO albumAssets (userID, albumID, assetID)
		SELECT ?, ?, val FROM tmpDesiredAssets
		WHERE val NOT IN (SELECT assetID FROM albumAssets WHERE userID = ? AND albumID = ?)`,
		userID, albumID, userID, albumID,
	); err != nil {
		return fmt.Errorf("insert new album assets: %w", err)
	}

	if _, err := tx.ExecContext(ctx, refreshAlbumGPSCountsSQL,
		userID, albumID, userID, albumID, userID, albumID,
	); err != nil {
		return fmt.Errorf("refresh album GPS counts: %w", err)
	}

	if _, err := tx.ExecContext(ctx, "DROP TABLE IF EXISTS tmpDesiredAssets"); err != nil {
		// Non-fatal: SQLite temp tables are session-scoped and will be cleaned up automatically.
		_ = err
	}
	return tx.Commit()
}

func (d *Database) getAlbumsWithNoGPSCount(ctx context.Context, userID string) ([]AlbumRow, error) {
	rows, err := d.db.QueryContext(ctx,
		`SELECT immichID, albumName, thumbnailAssetID, assetCount, updatedAt, startDate, noGPSCount
		FROM albums
		WHERE userID = ?
		ORDER BY startDate DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var albums []AlbumRow
	for rows.Next() {
		var a AlbumRow
		if err := rows.Scan(&a.ImmichID, &a.AlbumName, &a.ThumbnailAssetID, &a.AssetCount, &a.UpdatedAt, &a.StartDate, &a.NoGPSCount); err != nil {
			return nil, err
		}
		a.FilteredCount = a.NoGPSCount
		albums = append(albums, a)
	}
	return albums, rows.Err()
}

func (d *Database) getAlbumsWithGPSCount(ctx context.Context, userID string) ([]AlbumRow, error) {
	rows, err := d.db.QueryContext(ctx,
		`SELECT immichID, albumName, thumbnailAssetID, assetCount, updatedAt, startDate, gpsCount, noGPSCount
		FROM albums
		WHERE userID = ? AND gpsCount > 0
		ORDER BY startDate DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var albums []AlbumRow
	for rows.Next() {
		var a AlbumRow
		if err := rows.Scan(&a.ImmichID, &a.AlbumName, &a.ThumbnailAssetID, &a.AssetCount, &a.UpdatedAt, &a.StartDate, &a.FilteredCount, &a.NoGPSCount); err != nil {
			return nil, err
		}
		albums = append(albums, a)
	}
	return albums, rows.Err()
}

func (d *Database) getGeolocatedAssetsByAlbum(ctx context.Context, userID, albumID string) ([]AssetRow, error) {
	rows, err := d.db.QueryContext(ctx,
		`SELECT `+assetColumnsAliased+`
		FROM assets a
		JOIN albumAssets aa ON aa.userID = a.userID AND aa.assetID = a.immichID
		WHERE a.userID = ? AND aa.albumID = ? AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL
			AND a.stackPrimaryAssetID IS NULL`,
		userID, albumID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanAssetRows(rows)
}

func (d *Database) deleteAlbumsNotIn(ctx context.Context, userID string, albumIDs []string) error {
	if len(albumIDs) == 0 {
		_, err := d.db.ExecContext(ctx, "DELETE FROM albums WHERE userID = ?", userID)
		return err
	}

	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := bulkInsertTemp(ctx, tx, "tmpKeepAlbums", albumIDs); err != nil {
		return fmt.Errorf("populate temp table: %w", err)
	}

	if _, err := tx.ExecContext(ctx, "DELETE FROM albums WHERE userID = ? AND immichID NOT IN (SELECT val FROM tmpKeepAlbums)", userID); err != nil {
		return fmt.Errorf("delete stale albums: %w", err)
	}

	tx.ExecContext(ctx, "DROP TABLE IF EXISTS tmpKeepAlbums")
	return tx.Commit()
}

// refreshAlbumGPSCounts recomputes and stores the cached gpsCount and noGPSCount for an album.
func (d *Database) refreshAlbumGPSCounts(ctx context.Context, userID, albumID string) error {
	_, err := d.db.ExecContext(ctx, refreshAlbumGPSCountsSQL,
		userID, albumID, userID, albumID, userID, albumID,
	)
	return err
}

// getAlbumIDsForAssets returns the distinct album IDs that contain any of the given asset IDs.
func (d *Database) getAlbumIDsForAssets(ctx context.Context, userID string, assetIDs []string) ([]string, error) {
	if len(assetIDs) == 0 {
		return nil, nil
	}

	placeholders := make([]string, len(assetIDs))
	args := []interface{}{userID}
	for i, id := range assetIDs {
		placeholders[i] = "?"
		args = append(args, id)
	}

	query := fmt.Sprintf(
		"SELECT DISTINCT albumID FROM albumAssets WHERE userID = ? AND assetID IN (%s)",
		strings.Join(placeholders, ","),
	)
	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func bulkInsertTemp(ctx context.Context, tx *sql.Tx, tableName string, values []string) error {
	if _, err := tx.ExecContext(ctx, fmt.Sprintf("CREATE TEMP TABLE %s (val TEXT NOT NULL)", tableName)); err != nil {
		return err
	}

	for i := 0; i < len(values); i += sqliteChunkSize {
		end := i + sqliteChunkSize
		if end > len(values) {
			end = len(values)
		}
		chunk := values[i:end]

		placeholders := make([]string, len(chunk))
		args := make([]interface{}, len(chunk))
		for j, v := range chunk {
			placeholders[j] = "(?)"
			args[j] = v
		}

		query := fmt.Sprintf("INSERT INTO %s (val) VALUES %s", tableName, strings.Join(placeholders, ","))
		if _, err := tx.ExecContext(ctx, query, args...); err != nil {
			return err
		}
	}

	return nil
}
