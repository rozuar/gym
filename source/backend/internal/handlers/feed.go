package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type FeedHandler struct {
	feedRepo repository.FeedRepo
}

func NewFeedHandler(feedRepo repository.FeedRepo) *FeedHandler {
	return &FeedHandler{feedRepo: feedRepo}
}

func (h *FeedHandler) GetFeed(w http.ResponseWriter, r *http.Request) {
	limit := 30
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	events, err := h.feedRepo.GetFeed(limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch feed")
		return
	}
	if events == nil {
		events = []*models.FeedEventWithUser{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"events": events})
}

func (h *FeedHandler) CreateFistbump(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req struct {
		ResultID int64 `json:"result_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ResultID <= 0 {
		respondError(w, http.StatusBadRequest, "result_id is required")
		return
	}

	fb, err := h.feedRepo.CreateFistbump(userID, req.ResultID)
	if err != nil {
		respondError(w, http.StatusConflict, "Already fistbumped")
		return
	}

	respondJSON(w, http.StatusCreated, fb)
}

func (h *FeedHandler) DeleteFistbump(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req struct {
		ResultID int64 `json:"result_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ResultID <= 0 {
		respondError(w, http.StatusBadRequest, "result_id is required")
		return
	}

	if err := h.feedRepo.DeleteFistbump(userID, req.ResultID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to remove fistbump")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Fistbump removed"})
}
