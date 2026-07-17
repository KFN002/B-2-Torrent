package service

import (
	"context"

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
	s.logger.Warn("Demo torrent generation is disabled")
	return nil
}
