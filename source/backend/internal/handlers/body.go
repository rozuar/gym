package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type BodyHandler struct {
	repo *repository.BodyRepository
}

func NewBodyHandler(repo *repository.BodyRepository) *BodyHandler {
	return &BodyHandler{repo: repo}
}

func (h *BodyHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	measurements, err := h.repo.List(userID, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch measurements")
		return
	}
	if measurements == nil {
		measurements = []*models.BodyMeasurement{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"measurements": measurements})
}

func (h *BodyHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.CreateBodyMeasurementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	m := &models.BodyMeasurement{
		UserID:     userID,
		WeightKg:   req.WeightKg,
		BodyFatPct: req.BodyFatPct,
		ChestCm:    req.ChestCm,
		WaistCm:    req.WaistCm,
		HipCm:      req.HipCm,
		ArmCm:      req.ArmCm,
		ThighCm:    req.ThighCm,
		Notes:      req.Notes,
		PhotoURL:   req.PhotoURL,
	}

	if req.MeasuredAt != "" {
		if t, err := time.Parse("2006-01-02", req.MeasuredAt); err == nil {
			m.MeasuredAt = t
		}
	}
	if m.MeasuredAt.IsZero() {
		m.MeasuredAt = time.Now().Truncate(24 * time.Hour)
	}

	if err := h.repo.Create(m); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save measurement")
		return
	}
	respondJSON(w, http.StatusCreated, m)
}

func (h *BodyHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	if err := h.repo.Delete(id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete measurement")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
