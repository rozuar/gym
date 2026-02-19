package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type MovementHandler struct {
	repo *repository.MovementRepository
}

func NewMovementHandler(repo *repository.MovementRepository) *MovementHandler {
	return &MovementHandler{repo: repo}
}

func (h *MovementHandler) List(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")
	activeOnly := r.URL.Query().Get("active") != "false"
	movements, err := h.repo.List(category, search, activeOnly)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch movements")
		return
	}
	if movements == nil {
		movements = []*models.Movement{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"movements": movements})
}

func (h *MovementHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	m, err := h.repo.GetByID(id)
	if err != nil || m == nil {
		respondError(w, http.StatusNotFound, "Movement not found")
		return
	}
	respondJSON(w, http.StatusOK, m)
}

func (h *MovementHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMovementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}
	if req.Category == "" {
		req.Category = "other"
	}
	m := &models.Movement{
		Name:             req.Name,
		Description:      req.Description,
		Category:         req.Category,
		VideoURL:         req.VideoURL,
		MusclesPrimary:   req.MusclesPrimary,
		MusclesSecondary: req.MusclesSecondary,
		Active:           true,
	}
	if err := h.repo.Create(m); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create movement")
		return
	}
	respondJSON(w, http.StatusCreated, m)
}

func (h *MovementHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	m, err := h.repo.GetByID(id)
	if err != nil || m == nil {
		respondError(w, http.StatusNotFound, "Movement not found")
		return
	}
	var req struct {
		Name             string `json:"name"`
		Description      string `json:"description"`
		Category         string `json:"category"`
		VideoURL         string `json:"video_url"`
		MusclesPrimary   string `json:"muscles_primary"`
		MusclesSecondary string `json:"muscles_secondary"`
		Active           *bool  `json:"active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name != "" { m.Name = req.Name }
	if req.Description != "" { m.Description = req.Description }
	if req.Category != "" { m.Category = req.Category }
	if req.VideoURL != "" { m.VideoURL = req.VideoURL }
	if req.MusclesPrimary != "" { m.MusclesPrimary = req.MusclesPrimary }
	if req.MusclesSecondary != "" { m.MusclesSecondary = req.MusclesSecondary }
	if req.Active != nil { m.Active = *req.Active }
	if err := h.repo.Update(m); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update movement")
		return
	}
	respondJSON(w, http.StatusOK, m)
}

func (h *MovementHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	if err := h.repo.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete movement")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
