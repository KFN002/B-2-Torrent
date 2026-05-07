package service

import (
	"context"
	"fmt"

	"github.com/KFN002/B-2-Torrent/backend/internal/repository"
	"go.uber.org/zap"
)

type TorrentService struct {
	repo   *repository.TorrentRepository
	logger *zap.Logger
}

func NewTorrentService(repo *repository.TorrentRepository, logger *zap.Logger) *TorrentService {
	return &TorrentService{
		repo:   repo,
		logger: logger,
	}
}

func (s *TorrentService) ListTorrents(ctx context.Context, limit int) ([]repository.Torrent, error) {
	s.logger.Info("Listing torrents", zap.Int("limit", limit))
	return s.repo.GetAll(ctx, limit)
}

func (s *TorrentService) AddTorrent(ctx context.Context, torrent *repository.Torrent) error {
	s.logger.Info("Adding torrent", zap.String("name", torrent.Name))
	return s.repo.Save(ctx, torrent)
}

func (s *TorrentService) RemoveTorrent(ctx context.Context, infoHash string) error {
	s.logger.Info("Removing torrent", zap.String("info_hash", infoHash))
	return s.repo.Delete(ctx, infoHash)
}

func (s *TorrentService) ClearAllTorrents(ctx context.Context) error {
	s.logger.Warn("Clearing all torrents")
	return s.repo.ClearAll(ctx)
}

func (s *TorrentService) GenerateDemoData(ctx context.Context) error {
	s.logger.Info("Generating demo data")

	demoTorrents := []repository.Torrent{
		{
			InfoHash:     "demo1234567890abcdef",
			Name:         "Demo Movie 1080p",
			TotalSize:    1500000000,
			Downloaded:   750000000,
			Uploaded:     150000000,
			DownloadRate: 2500000,
			UploadRate:   500000,
			Progress:     0.5,
			Status:       "downloading",
			MagnetURI:    "magnet:?xt=urn:btih:demo1234567890abcdef",
		},
		{
			InfoHash:     "demo0987654321fedcba",
			Name:         "Demo Software v2.0",
			TotalSize:    500000000,
			Downloaded:   500000000,
			Uploaded:     250000000,
			DownloadRate: 0,
			UploadRate:   1000000,
			Progress:     1.0,
			Status:       "seeding",
			MagnetURI:    "magnet:?xt=urn:btih:demo0987654321fedcba",
		},
	}

	for _, t := range demoTorrents {
		if err := s.repo.Save(ctx, &t); err != nil {
			return fmt.Errorf("failed to save demo torrent: %w", err)
		}
	}

	s.logger.Info("Demo data generated successfully")
	return nil
}
