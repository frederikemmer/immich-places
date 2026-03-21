package main

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

func (d *Database) decryptUserAPIKey(u *UserRow) error {
	if u.ImmichAPIKey == nil {
		return nil
	}
	plaintext, err := decryptValue(d.encryptionKey, *u.ImmichAPIKey)
	if err != nil {
		return fmt.Errorf("decrypt API key for user %s: %w", u.ID, err)
	}
	u.ImmichAPIKey = &plaintext
	return nil
}

func (d *Database) decryptDawarichAPIKey(u *UserRow) error {
	if u.DawarichAPIKey == nil {
		return nil
	}
	plaintext, err := decryptValue(d.encryptionKey, *u.DawarichAPIKey)
	if err != nil {
		return fmt.Errorf("decrypt Dawarich API key for user %s: %w", u.ID, err)
	}
	u.DawarichAPIKey = &plaintext
	return nil
}

func (d *Database) decryptUserSecrets(u *UserRow) error {
	if err := d.decryptUserAPIKey(u); err != nil {
		return err
	}
	return d.decryptDawarichAPIKey(u)
}

func (d *Database) createUser(ctx context.Context, ID, email, passwordHash string) error {
	_, err := d.db.ExecContext(ctx,
		`INSERT INTO users (ID, email, passwordHash) VALUES (?, ?, ?)`,
		ID, email, passwordHash,
	)
	return err
}

func (d *Database) getUserByEmail(ctx context.Context, email string) (*UserRow, error) {
	row := d.db.QueryRowContext(ctx,
		`SELECT ID, email, passwordHash, immichAPIKey, dawarichAPIKey, createdAt, updatedAt FROM users WHERE email = ?`,
		email,
	)
	var u UserRow
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.ImmichAPIKey, &u.DawarichAPIKey, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if err := d.decryptUserSecrets(&u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (d *Database) getUserByID(ctx context.Context, ID string) (*UserRow, error) {
	row := d.db.QueryRowContext(ctx,
		`SELECT ID, email, passwordHash, immichAPIKey, dawarichAPIKey, createdAt, updatedAt FROM users WHERE ID = ?`,
		ID,
	)
	var u UserRow
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.ImmichAPIKey, &u.DawarichAPIKey, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if err := d.decryptUserSecrets(&u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (d *Database) updateImmichAPIKey(ctx context.Context, userID string, key *string) error {
	var stored *string
	if key != nil {
		encrypted, err := encryptValue(d.encryptionKey, *key)
		if err != nil {
			return fmt.Errorf("encrypt API key: %w", err)
		}
		stored = &encrypted
	}
	_, err := d.db.ExecContext(ctx,
		`UPDATE users SET immichAPIKey = ?, updatedAt = datetime('now') WHERE ID = ?`,
		stored, userID,
	)
	return err
}

func (d *Database) countUsers(ctx context.Context) (int, error) {
	var count int
	err := d.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
	return count, err
}

func (d *Database) getUsersWithAPIKeys(ctx context.Context) ([]UserRow, error) {
	rows, err := d.db.QueryContext(ctx,
		`SELECT ID, email, passwordHash, immichAPIKey, dawarichAPIKey, createdAt, updatedAt FROM users WHERE immichAPIKey IS NOT NULL`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []UserRow
	for rows.Next() {
		var u UserRow
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.ImmichAPIKey, &u.DawarichAPIKey, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		if err := d.decryptUserSecrets(&u); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (d *Database) createSession(ctx context.Context, tokenHash, userID string, expiresAt time.Time) error {
	_, err := d.db.ExecContext(ctx,
		`INSERT INTO sessions (tokenHash, userID, expiresAt) VALUES (?, ?, ?)`,
		tokenHash, userID, expiresAt.UTC().Format("2006-01-02 15:04:05"),
	)
	return err
}

func (d *Database) getSessionUser(ctx context.Context, tokenHash string) (*UserRow, error) {
	row := d.db.QueryRowContext(ctx,
		`SELECT u.ID, u.email, u.passwordHash, u.immichAPIKey, u.dawarichAPIKey, u.createdAt, u.updatedAt
		FROM sessions s
		JOIN users u ON u.ID = s.userID
		WHERE s.tokenHash = ? AND s.expiresAt > datetime('now')`,
		tokenHash,
	)
	var u UserRow
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.ImmichAPIKey, &u.DawarichAPIKey, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if err := d.decryptUserSecrets(&u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (d *Database) deleteSession(ctx context.Context, tokenHash string) error {
	_, err := d.db.ExecContext(ctx, `DELETE FROM sessions WHERE tokenHash = ?`, tokenHash)
	return err
}

func (d *Database) deleteUserSessions(ctx context.Context, userID string) error {
	_, err := d.db.ExecContext(ctx, `DELETE FROM sessions WHERE userID = ?`, userID)
	return err
}

func (d *Database) deleteExpiredSessions(ctx context.Context) error {
	_, err := d.db.ExecContext(ctx, `DELETE FROM sessions WHERE expiresAt <= datetime('now')`)
	return err
}

func (d *Database) updateDawarichAPIKey(ctx context.Context, userID string, apiKey *string) error {
	var storedKey *string
	if apiKey != nil {
		encrypted, err := encryptValue(d.encryptionKey, *apiKey)
		if err != nil {
			return fmt.Errorf("encrypt Dawarich API key: %w", err)
		}
		storedKey = &encrypted
	}
	_, err := d.db.ExecContext(ctx,
		`UPDATE users SET dawarichAPIKey = ?, updatedAt = datetime('now') WHERE ID = ?`,
		storedKey, userID,
	)
	return err
}

func (d *Database) claimLegacyData(ctx context.Context, newUserID string) error {
	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "PRAGMA defer_foreign_keys = ON"); err != nil {
		return err
	}

	var legacyID string
	err = tx.QueryRowContext(ctx, "SELECT ID FROM users WHERE ID = '__legacy__'").Scan(&legacyID)
	if err != nil {
		return nil
	}

	for _, table := range []string{"assets", "albums", "albumAssets", "frequentLocations"} {
		if _, err := tx.ExecContext(ctx, "UPDATE "+table+" SET userID = ? WHERE userID = '__legacy__'", newUserID); err != nil {
			return err
		}
	}

	if _, err := tx.ExecContext(ctx, "UPDATE syncState SET userID = ? WHERE userID = '__legacy__'", newUserID); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, "DELETE FROM users WHERE ID = '__legacy__'"); err != nil {
		return err
	}

	return tx.Commit()
}
