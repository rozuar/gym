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

type EventHandler struct {
	repo *repository.EventRepository
}

func NewEventHandler(repo *repository.EventRepository) *EventHandler {
	return &EventHandler{repo: repo}
}

func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	activeOnly := r.URL.Query().Get("active") != "false"
	events, err := h.repo.List(userID, activeOnly)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch events")
		return
	}
	if events == nil {
		events = []*models.Event{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"events": events})
}

func (h *EventHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	userID := middleware.GetUserID(r.Context())
	e, err := h.repo.GetByID(id, userID)
	if err != nil || e == nil {
		respondError(w, http.StatusNotFound, "Event not found")
		return
	}
	regs, _ := h.repo.ListRegistrations(id)
	if regs == nil {
		regs = []*models.EventRegistration{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"event": e, "registrations": regs})
}

func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var req models.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Title == "" {
		respondError(w, http.StatusBadRequest, "Title is required")
		return
	}
	if req.Date == "" {
		respondError(w, http.StatusBadRequest, "Date is required")
		return
	}
	date, err := time.Parse(time.RFC3339, req.Date)
	if err != nil {
		date, err = time.Parse("2006-01-02T15:04", req.Date)
		if err != nil {
			date, err = time.Parse("2006-01-02", req.Date)
			if err != nil {
				respondError(w, http.StatusBadRequest, "Invalid date format")
				return
			}
		}
	}
	if req.EventType == "" {
		req.EventType = "event"
	}
	if req.Currency == "" {
		req.Currency = "CLP"
	}
	e := &models.Event{
		Title:       req.Title,
		Description: req.Description,
		EventType:   req.EventType,
		Date:        date,
		Capacity:    req.Capacity,
		Price:       req.Price,
		Currency:    req.Currency,
		ImageURL:    req.ImageURL,
		CreatedBy:   userID,
	}
	if err := h.repo.Create(e); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create event")
		return
	}
	respondJSON(w, http.StatusCreated, e)
}

func (h *EventHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	userID := middleware.GetUserID(r.Context())
	e, err := h.repo.GetByID(id, userID)
	if err != nil || e == nil {
		respondError(w, http.StatusNotFound, "Event not found")
		return
	}
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		EventType   string `json:"event_type"`
		Date        string `json:"date"`
		Capacity    *int   `json:"capacity"`
		Price       *int64 `json:"price"`
		Currency    string `json:"currency"`
		ImageURL    string `json:"image_url"`
		Active      *bool  `json:"active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Title != "" { e.Title = req.Title }
	if req.Description != "" { e.Description = req.Description }
	if req.EventType != "" { e.EventType = req.EventType }
	if req.Date != "" {
		if d, err := time.Parse(time.RFC3339, req.Date); err == nil { e.Date = d }
		if d, err := time.Parse("2006-01-02T15:04", req.Date); err == nil { e.Date = d }
	}
	if req.Capacity != nil { e.Capacity = *req.Capacity }
	if req.Price != nil { e.Price = *req.Price }
	if req.Currency != "" { e.Currency = req.Currency }
	if req.ImageURL != "" { e.ImageURL = req.ImageURL }
	if req.Active != nil { e.Active = *req.Active }
	if err := h.repo.Update(e); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update event")
		return
	}
	respondJSON(w, http.StatusOK, e)
}

func (h *EventHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	if err := h.repo.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete event")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *EventHandler) Register(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	userID := middleware.GetUserID(r.Context())
	e, err := h.repo.GetByID(id, userID)
	if err != nil || e == nil {
		respondError(w, http.StatusNotFound, "Event not found")
		return
	}
	if e.Capacity > 0 && e.RegisteredCount >= e.Capacity {
		respondError(w, http.StatusConflict, "Event is full")
		return
	}
	if err := h.repo.Register(id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to register")
		return
	}
	respondJSON(w, http.StatusOK, map[string]bool{"registered": true})
}

func (h *EventHandler) Unregister(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	userID := middleware.GetUserID(r.Context())
	if err := h.repo.Unregister(id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to unregister")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *EventHandler) MyEvents(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	events, err := h.repo.MyEvents(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch events")
		return
	}
	if events == nil {
		events = []*models.Event{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"events": events})
}

func (h *EventHandler) ListRegistrations(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	regs, err := h.repo.ListRegistrations(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch registrations")
		return
	}
	if regs == nil {
		regs = []*models.EventRegistration{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"registrations": regs})
}

func (h *EventHandler) UpdateRegistration(w http.ResponseWriter, r *http.Request) {
	eventID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid event ID")
		return
	}
	var req struct {
		UserID int64 `json:"user_id"`
		Paid   bool  `json:"paid"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if err := h.repo.UpdateRegistration(eventID, req.UserID, req.Paid); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update registration")
		return
	}
	respondJSON(w, http.StatusOK, map[string]bool{"updated": true})
}

