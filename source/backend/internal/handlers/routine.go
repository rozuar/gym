package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type RoutineHandler struct {
	routineRepo *repository.RoutineRepository
}

func NewRoutineHandler(db *sql.DB) *RoutineHandler {
	return &RoutineHandler{
		routineRepo: repository.NewRoutineRepository(db),
	}
}

func (h *RoutineHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.CreateRoutineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" || req.Content == "" {
		respondError(w, http.StatusBadRequest, "Name and content are required")
		return
	}

	if req.Type == "" {
		req.Type = "wod"
	}

	routine := &models.Routine{
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Content:     req.Content,
		Duration:    req.Duration,
		Difficulty:  req.Difficulty,
		CreatedBy:   userID,
		Active:      true,
	}

	if err := h.routineRepo.Create(routine); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create routine")
		return
	}

	respondJSON(w, http.StatusCreated, routine)
}

func (h *RoutineHandler) List(w http.ResponseWriter, r *http.Request) {
	routineType := r.URL.Query().Get("type")
	limit := 50
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

	routines, err := h.routineRepo.List(routineType, limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch routines")
		return
	}
	if routines == nil {
		routines = []*models.RoutineWithCreator{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"routines": routines,
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *RoutineHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid routine ID")
		return
	}

	routine, err := h.routineRepo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Routine not found")
		return
	}

	respondJSON(w, http.StatusOK, routine)
}

func (h *RoutineHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid routine ID")
		return
	}

	var req models.UpdateRoutineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	routine, err := h.routineRepo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Routine not found")
		return
	}

	if req.Name != "" {
		routine.Name = req.Name
	}
	if req.Description != "" {
		routine.Description = req.Description
	}
	if req.Type != "" {
		routine.Type = req.Type
	}
	if req.Content != "" {
		routine.Content = req.Content
	}
	if req.Duration != nil {
		routine.Duration = *req.Duration
	}
	if req.Difficulty != "" {
		routine.Difficulty = req.Difficulty
	}
	if req.Active != nil {
		routine.Active = *req.Active
	}

	if err := h.routineRepo.Update(&routine.Routine); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update routine")
		return
	}

	respondJSON(w, http.StatusOK, routine)
}

func (h *RoutineHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid routine ID")
		return
	}

	if err := h.routineRepo.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete routine")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *RoutineHandler) AssignToSchedule(w http.ResponseWriter, r *http.Request) {
	scheduleID, err := strconv.ParseInt(r.PathValue("scheduleId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid schedule ID")
		return
	}

	var req models.AssignRoutineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.RoutineID <= 0 {
		respondError(w, http.StatusBadRequest, "Routine ID is required")
		return
	}

	sr := &models.ScheduleRoutine{
		ClassScheduleID: scheduleID,
		RoutineID:       req.RoutineID,
		Notes:           req.Notes,
	}

	if err := h.routineRepo.AssignToSchedule(sr); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to assign routine")
		return
	}

	respondJSON(w, http.StatusOK, sr)
}

func (h *RoutineHandler) GetScheduleRoutine(w http.ResponseWriter, r *http.Request) {
	scheduleID, err := strconv.ParseInt(r.PathValue("scheduleId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid schedule ID")
		return
	}

	routine, err := h.routineRepo.GetScheduleRoutine(scheduleID)
	if err != nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{"routine": nil})
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"routine": routine})
}

func (h *RoutineHandler) LogResult(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.LogResultRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.RoutineID <= 0 || req.Score == "" {
		respondError(w, http.StatusBadRequest, "Routine ID and score are required")
		return
	}

	result := &models.UserRoutineResult{
		UserID:          userID,
		RoutineID:       req.RoutineID,
		ClassScheduleID: req.ClassScheduleID,
		Score:           req.Score,
		Notes:           req.Notes,
		Rx:              req.Rx,
	}

	if err := h.routineRepo.LogResult(result); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to log result")
		return
	}

	respondJSON(w, http.StatusCreated, result)
}

func (h *RoutineHandler) MyResults(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	results, err := h.routineRepo.GetUserResults(userID, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch results")
		return
	}
	if results == nil {
		results = []*models.UserResultWithDetails{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"results": results})
}

func (h *RoutineHandler) GetRoutineHistory(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	routineID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid routine ID")
		return
	}

	results, err := h.routineRepo.GetRoutineHistory(routineID, userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch history")
		return
	}
	if results == nil {
		results = []*models.UserRoutineResult{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"history": results})
}
