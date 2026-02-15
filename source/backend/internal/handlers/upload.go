package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"

	"boxmagic/internal/config"
)

type UploadHandler struct {
	cfg *config.Config
}

func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{cfg: cfg}
}

func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "File too large (max 10MB)")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Validate MIME type
	contentType := header.Header.Get("Content-Type")
	var ext string
	switch contentType {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	default:
		// Try detecting from file content
		buf := make([]byte, 512)
		n, _ := file.Read(buf)
		detected := http.DetectContentType(buf[:n])
		file.Seek(0, io.SeekStart)

		switch detected {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		default:
			respondError(w, http.StatusBadRequest, "Only JPEG, PNG, and WebP images are allowed")
			return
		}
	}

	// Generate unique filename
	filename := uuid.New().String() + ext

	// Ensure upload dir exists
	if err := os.MkdirAll(h.cfg.UploadDir, 0755); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	// Save file
	destPath := filepath.Join(h.cfg.UploadDir, filename)
	dst, err := os.Create(destPath)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	url := fmt.Sprintf("%s/uploads/%s", strings.TrimRight(h.cfg.BaseURL, "/"), filename)
	respondJSON(w, http.StatusOK, map[string]string{"url": url})
}
