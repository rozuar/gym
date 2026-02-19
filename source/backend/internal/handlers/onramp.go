package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type OnrampHandler struct {
	repo *repository.OnrampRepository
}

func NewOnrampHandler(repo *repository.OnrampRepository) *OnrampHandler {
	return &OnrampHandler{repo: repo}
}

func (h *OnrampHandler) ListPrograms(w http.ResponseWriter, r *http.Request) {
	activeOnly := r.URL.Query().Get("active") != "false"
	programs, err := h.repo.ListPrograms(activeOnly)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch programs")
		return
	}
	if programs == nil {
		programs = []*models.OnrampProgram{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"programs": programs})
}

func (h *OnrampHandler) CreateProgram(w http.ResponseWriter, r *http.Request) {
	var req models.CreateOnrampProgramRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}
	if req.RequiredSessions <= 0 {
		req.RequiredSessions = 4
	}

	p := &models.OnrampProgram{
		Name:             req.Name,
		Description:      req.Description,
		RequiredSessions: req.RequiredSessions,
		Active:           true,
	}
	if err := h.repo.CreateProgram(p); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create program")
		return
	}
	respondJSON(w, http.StatusCreated, p)
}

func (h *OnrampHandler) UpdateProgram(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid program ID")
		return
	}

	var req struct {
		Name             string `json:"name,omitempty"`
		Description      string `json:"description,omitempty"`
		RequiredSessions int    `json:"required_sessions,omitempty"`
		Active           *bool  `json:"active,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	programs, err := h.repo.ListPrograms(false)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch program")
		return
	}
	var p *models.OnrampProgram
	for _, prog := range programs {
		if prog.ID == id {
			p = prog
			break
		}
	}
	if p == nil {
		respondError(w, http.StatusNotFound, "Program not found")
		return
	}

	if req.Name != "" {
		p.Name = req.Name
	}
	if req.Description != "" {
		p.Description = req.Description
	}
	if req.RequiredSessions > 0 {
		p.RequiredSessions = req.RequiredSessions
	}
	if req.Active != nil {
		p.Active = *req.Active
	}

	if err := h.repo.UpdateProgram(p); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update program")
		return
	}
	respondJSON(w, http.StatusOK, p)
}

func (h *OnrampHandler) DeleteProgram(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid program ID")
		return
	}
	if err := h.repo.DeleteProgram(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete program")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *OnrampHandler) Enroll(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID    int64 `json:"user_id"`
		ProgramID int64 `json:"program_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.UserID == 0 || req.ProgramID == 0 {
		respondError(w, http.StatusBadRequest, "user_id and program_id are required")
		return
	}
	if err := h.repo.Enroll(req.UserID, req.ProgramID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to enroll")
		return
	}
	respondJSON(w, http.StatusOK, map[string]bool{"enrolled": true})
}

func (h *OnrampHandler) UpdateSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(r.PathValue("userId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}
	programID, err := strconv.ParseInt(r.PathValue("programId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid program ID")
		return
	}

	var req models.UpdateSessionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.repo.UpdateSessions(userID, programID, req.Sessions); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update sessions")
		return
	}
	respondJSON(w, http.StatusOK, map[string]bool{"updated": true})
}

func (h *OnrampHandler) ListEnrollments(w http.ResponseWriter, r *http.Request) {
	programID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid program ID")
		return
	}
	enrollments, err := h.repo.ListEnrollments(programID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch enrollments")
		return
	}
	if enrollments == nil {
		enrollments = []*models.OnrampEnrollment{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"enrollments": enrollments})
}

func (h *OnrampHandler) MyEnrollments(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	enrollments, err := h.repo.GetUserEnrollments(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch enrollments")
		return
	}
	if enrollments == nil {
		enrollments = []*models.OnrampEnrollment{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"enrollments": enrollments})
}
