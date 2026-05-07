package api

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func normalizeUserFilePath(input string) (string, error) {
	if strings.TrimSpace(input) == "" {
		return "", fmt.Errorf("file path is required")
	}

	absPath, err := filepath.Abs(input)
	if err != nil {
		return "", fmt.Errorf("invalid file path: %w", err)
	}
	absPath = filepath.Clean(absPath)

	if resolved, err := filepath.EvalSymlinks(absPath); err == nil {
		absPath = resolved
	}

	for _, root := range allowedFileRoots() {
		if isPathWithin(absPath, root) {
			return absPath, nil
		}
	}

	return "", fmt.Errorf("file path is outside allowed app directories")
}

func allowedFileRoots() []string {
	candidates := []string{
		os.Getenv("DOWNLOAD_DIR"),
		os.Getenv("UPLOAD_DIR"),
		os.Getenv("TEMP_DIR"),
	}

	roots := make([]string, 0, len(candidates))
	seen := map[string]struct{}{}
	for _, candidate := range candidates {
		if strings.TrimSpace(candidate) == "" {
			continue
		}
		absRoot, err := filepath.Abs(candidate)
		if err != nil {
			continue
		}
		absRoot = filepath.Clean(absRoot)
		if resolved, err := filepath.EvalSymlinks(absRoot); err == nil {
			absRoot = resolved
		}
		if _, ok := seen[absRoot]; ok {
			continue
		}
		seen[absRoot] = struct{}{}
		roots = append(roots, absRoot)
	}
	return roots
}

func isPathWithin(path, root string) bool {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return false
	}
	return rel == "." || (rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)))
}
