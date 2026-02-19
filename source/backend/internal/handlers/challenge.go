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

type ChallengeHandler struct {
	repo *repository.ChallengeRepository
}

func NewChallengeHandler(repo *repository.ChallengeRepository) *ChallengeHandler {
	return &ChallengeHandler{repo: repo}
}

func (h *ChallengeHandler) List(w http.ResponseWriter, r *http.Request) {
	activeOnly := r.URL.Query().Get("active") != "false"
	challenges, err := h.repo.List(activeOnly)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch challenges")
		return
	}
	if challenges == nil {
		challenges = []*models.Challenge{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"challenges": challenges})
}

func (h *ChallengeHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid challenge ID")
		return
	}

	challenge, err := h.repo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Challenge not found")
		return
	}

	participants, _ := h.repo.GetParticipants(id)
	if participants == nil {
		participants = []*models.ChallengeParticipant{}
	}

	// Check if current user is a participant
	userID := middleware.GetUserID(r.Context())
	isParticipant, _ := h.repo.IsParticipant(id, userID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"challenge":      challenge,
		"participants":   participants,
		"is_participant": isParticipant,
	})
}

func (h *ChallengeHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.CreateChallengeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}
	if req.Type == "" {
		req.Type = "custom"
	}

	c := &models.Challenge{
		Name:        req.Name,
		Description: req.Description,
		Goal:        req.Goal,
		Type:        req.Type,
		CreatedBy:   userID,
	}
	if req.StartDate != "" {
		t, err := time.Parse("2006-01-02", req.StartDate)
		if err == nil {
			c.StartDate = &t
		}
	}
	if req.EndDate != "" {
		t, err := time.Parse("2006-01-02", req.EndDate)
		if err == nil {
			c.EndDate = &t
		}
	}

	if err := h.repo.Create(c); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create challenge")
		return
	}
	respondJSON(w, http.StatusCreated, c)
}

func (h *ChallengeHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid challenge ID")
		return
	}

	challenge, err := h.repo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Challenge not found")
		return
	}

	var req models.UpdateChallengeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name != "" {
		challenge.Name = req.Name
	}
	if req.Description != "" {
		challenge.Description = req.Description
	}
	if req.Goal != "" {
		challenge.Goal = req.Goal
	}
	if req.Type != "" {
		challenge.Type = req.Type
	}
	if req.Active != nil {
		challenge.Active = *req.Active
	}
	if req.StartDate != nil {
		if *req.StartDate == "" {
			challenge.StartDate = nil
		} else if t, err := time.Parse("2006-01-02", *req.StartDate); err == nil {
			challenge.StartDate = &t
		}
	}
	if req.EndDate != nil {
		if *req.EndDate == "" {
			challenge.EndDate = nil
		} else if t, err := time.Parse("2006-01-02", *req.EndDate); err == nil {
			challenge.EndDate = &t
		}
	}

	if err := h.repo.Update(challenge); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update challenge")
		return
	}
	respondJSON(w, http.StatusOK, challenge)
}

func (h *ChallengeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid challenge ID")
		return
	}
	if err := h.repo.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete challenge")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ChallengeHandler) Join(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid challenge ID")
		return
	}
	if err := h.repo.Join(id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to join challenge")
		return
	}
	respondJSON(w, http.StatusOK, map[string]bool{"joined": true})
}

func (h *ChallengeHandler) Leave(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid challenge ID")
		return
	}
	if err := h.repo.Leave(id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to leave challenge")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ChallengeHandler) SubmitProgress(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid challenge ID")
		return
	}

	isParticipant, err := h.repo.IsParticipant(id, userID)
	if err != nil || !isParticipant {
		respondError(w, http.StatusForbidden, "You must join the challenge first")
		return
	}

	var req models.SubmitProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.repo.SubmitProgress(id, userID, req.Score, req.Notes); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to submit progress")
		return
	}
	respondJSON(w, http.StatusOK, map[string]bool{"submitted": true})
}

func (h *ChallengeHandler) MyChallenges(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	challenges, err := h.repo.GetUserChallenges(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch challenges")
		return
	}
	if challenges == nil {
		challenges = []*models.Challenge{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"challenges": challenges})
}
