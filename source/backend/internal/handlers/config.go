package handlers

import (
	"net/http"

	"boxmagic/internal/config"
)

// ConfigHandler returns public config values for the frontend
type ConfigHandler struct {
	cfg *config.Config
}

func NewConfigHandler(cfg *config.Config) *ConfigHandler {
	return &ConfigHandler{cfg: cfg}
}

func (h *ConfigHandler) Get(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"invitation_class_price":   h.cfg.InvitationClassPrice,
		"before_class_photo_price": h.cfg.BeforeClassPhotoPrice,
	})
}
