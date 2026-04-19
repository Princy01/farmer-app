package disputes

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const maxDisputeImageSizeBytes int64 = 3 * 1024 * 1024
const maxDisputeImagesPerCase = 3

var allowedDisputeImageMIMEs = map[string]struct{}{
	"image/jpeg": {},
	"image/png":  {},
	"image/webp": {},
}

type SavedLocalEvidence struct {
	FileName       string
	MimeType       string
	FileStorageKey string
}

func saveTemporaryEvidenceImage(caseID int64, fileHeader *multipart.FileHeader) (*SavedLocalEvidence, error) {
	if fileHeader == nil {
		return nil, errors.New("image is required")
	}
	if fileHeader.Size <= 0 {
		return nil, errors.New("image is empty")
	}
	if fileHeader.Size > maxDisputeImageSizeBytes {
		return nil, errors.New("image must be 3 MB or smaller")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	header := make([]byte, 512)
	n, err := src.Read(header)
	if err != nil && err != io.EOF {
		return nil, err
	}

	mimeType := http.DetectContentType(header[:n])
	if _, ok := allowedDisputeImageMIMEs[mimeType]; !ok {
		return nil, errors.New("only jpeg, png, or webp images are allowed")
	}

	if seeker, ok := src.(io.Seeker); ok {
		if _, err := seeker.Seek(0, io.SeekStart); err != nil {
			return nil, err
		}
	} else {
		return nil, errors.New("unable to read uploaded image")
	}

	rootDir := os.Getenv("DISPUTE_EVIDENCE_DIR")
	if rootDir == "" {
		rootDir = filepath.Join(os.TempDir(), "ekd_disputes", "active")
	}

	if err := os.MkdirAll(rootDir, 0o755); err != nil {
		return nil, err
	}

	storagePath := filepath.Join(rootDir, buildDisputeEvidenceStorageName(caseID, fileHeader.Filename, mimeType))

	dst, err := os.Create(storagePath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return nil, err
	}

	return &SavedLocalEvidence{
		FileName:       fileHeader.Filename,
		MimeType:       mimeType,
		FileStorageKey: storagePath,
	}, nil
}

func buildDisputeEvidenceStorageName(caseID int64, originalFileName string, mimeType string) string {
	ext := strings.ToLower(strings.TrimSpace(filepath.Ext(originalFileName)))
	if ext == "" {
		switch mimeType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		default:
			ext = ""
		}
	}

	return fmt.Sprintf("case_%d_%d%s", caseID, time.Now().UnixNano(), ext)
}

func removeStoredEvidenceFile(storageKey string) error {
	if strings.TrimSpace(storageKey) == "" {
		return nil
	}
	if err := os.Remove(storageKey); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}
