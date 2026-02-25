package main

import (
	"database/sql"
	"embed"
	"fmt"

	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var embedMigrations embed.FS

func runMigrations(db *sql.DB) error {
	goose.SetBaseFS(embedMigrations)

	if err := goose.SetDialect("sqlite3"); err != nil {
		return fmt.Errorf("goose dialect: %w", err)
	}

	goose.SetLogger(goose.NopLogger())

	if !gooseTableExists(db) && isExistingDatabase(db) {
		if err := stampExistingDatabase(db); err != nil {
			return fmt.Errorf("bootstrap existing database: %w", err)
		}
	}

	if err := goose.Up(db, "migrations"); err != nil {
		return fmt.Errorf("goose up: %w", err)
	}

	return nil
}

func gooseTableExists(db *sql.DB) bool {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='goose_db_version'").Scan(&count)
	return err == nil && count > 0
}

func isExistingDatabase(db *sql.DB) bool {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='assets'").Scan(&count)
	return err == nil && count > 0
}

func stampExistingDatabase(db *sql.DB) error {
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS goose_db_version (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		version_id INTEGER NOT NULL,
		is_applied INTEGER NOT NULL,
		tstamp TEXT DEFAULT (datetime('now'))
	)`); err != nil {
		return err
	}

	if _, err := db.Exec(
		"INSERT INTO goose_db_version (version_id, is_applied) VALUES (?, ?)", 1, 1,
	); err != nil {
		return err
	}

	return nil
}
