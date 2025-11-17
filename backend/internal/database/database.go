package database

import (
	"database/sql"
	"time"

	_ "github.com/lib/pq"
)

type Database struct {
	db *sql.DB
}

type Torrent struct {
	InfoHash     string    `json:"infoHash"`
	Name         string    `json:"name"`
	TotalSize    int64     `json:"totalSize"`
	Downloaded   int64     `json:"downloaded"`
	Uploaded     int64     `json:"uploaded"`
	DownloadRate int64     `json:"downloadRate"`
	UploadRate   int64     `json:"uploadRate"`
	Progress     float64   `json:"progress"`
	Status       string    `json:"status"`
	MagnetURI    string    `json:"magnetUri"`
	CreatedAt    time.Time `json:"createdAt"`
}

func New(dbURL string) (*Database, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &Database{db: db}, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

func (d *Database) ClearActiveTorrents() error {
	_, err := d.db.Exec("DELETE FROM active_torrents")
	return err
}

func (d *Database) SaveTorrent(t *Torrent) error {
	query := `
		INSERT INTO active_torrents 
		(info_hash, name, total_size, downloaded, uploaded, download_rate, upload_rate, progress, status, magnet_uri)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (info_hash) DO UPDATE SET
			downloaded = $4,
			uploaded = $5,
			download_rate = $6,
			upload_rate = $7,
			progress = $8,
			status = $9
	`
	_, err := d.db.Exec(query, t.InfoHash, t.Name, t.TotalSize, t.Downloaded,
		t.Uploaded, t.DownloadRate, t.UploadRate, t.Progress, t.Status, t.MagnetURI)
	return err
}

func (d *Database) GetAllTorrents() ([]Torrent, error) {
	query := `SELECT info_hash, name, total_size, downloaded, uploaded, 
			  download_rate, upload_rate, progress, status, magnet_uri, created_at 
			  FROM active_torrents ORDER BY created_at DESC`

	rows, err := d.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var torrents []Torrent
	for rows.Next() {
		var t Torrent
		err := rows.Scan(&t.InfoHash, &t.Name, &t.TotalSize, &t.Downloaded,
			&t.Uploaded, &t.DownloadRate, &t.UploadRate, &t.Progress,
			&t.Status, &t.MagnetURI, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		torrents = append(torrents, t)
	}
	return torrents, nil
}

func (d *Database) DeleteTorrent(infoHash string) error {
	_, err := d.db.Exec("DELETE FROM active_torrents WHERE info_hash = $1", infoHash)
	return err
}

func (d *Database) GetSetting(key string) (string, error) {
	var value string
	err := d.db.QueryRow("SELECT value FROM settings WHERE key = $1", key).Scan(&value)
	return value, err
}

func (d *Database) SetSetting(key, value string) error {
	query := `INSERT INTO settings (key, value) VALUES ($1, $2)
			  ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`
	_, err := d.db.Exec(query, key, value)
	return err
}
