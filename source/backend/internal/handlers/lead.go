package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type LeadHandler struct {
	repo *repository.LeadRepository
}

func NewLeadHandler(repo *repository.LeadRepository) *LeadHandler {
	return &LeadHandler{repo: repo}
}

func (h *LeadHandler) List(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	leads, err := h.repo.List(status)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch leads")
		return
	}
	if leads == nil {
		leads = []*models.Lead{}
	}

	counts, _ := h.repo.CountByStatus()
	respondJSON(w, http.StatusOK, map[string]interface{}{"leads": leads, "counts": counts})
}

func (h *LeadHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}

	if req.Source == "" {
		req.Source = models.LeadSourceOther
	}

	lead := &models.Lead{
		Name:       req.Name,
		Email:      req.Email,
		Phone:      req.Phone,
		Source:     req.Source,
		Status:     models.LeadStatusNew,
		Notes:      req.Notes,
		AssignedTo: req.AssignedTo,
	}

	if err := h.repo.Create(lead); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create lead")
		return
	}
	respondJSON(w, http.StatusCreated, lead)
}

func (h *LeadHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid lead ID")
		return
	}

	lead, err := h.repo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Lead not found")
		return
	}

	var req models.UpdateLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name != "" {
		lead.Name = req.Name
	}
	if req.Email != "" {
		lead.Email = req.Email
	}
	if req.Phone != "" {
		lead.Phone = req.Phone
	}
	if req.Source != "" {
		lead.Source = req.Source
	}
	if req.Status != "" {
		lead.Status = req.Status
	}
	if req.Notes != "" {
		lead.Notes = req.Notes
	}
	if req.AssignedTo != nil {
		lead.AssignedTo = req.AssignedTo
	}

	if err := h.repo.Update(lead); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update lead")
		return
	}
	respondJSON(w, http.StatusOK, lead)
}

func (h *LeadHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid lead ID")
		return
	}
	if err := h.repo.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete lead")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// PublicCapture handles the public lead capture form (no auth required — 6.2)
func (h *LeadHandler) PublicCapture(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name   string `json:"name"`
		Email  string `json:"email"`
		Phone  string `json:"phone"`
		Source string `json:"source"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}
	if req.Source == "" {
		req.Source = models.LeadSourceWeb
	}
	lead := &models.Lead{
		Name:   req.Name,
		Email:  req.Email,
		Phone:  req.Phone,
		Source: req.Source,
		Status: models.LeadStatusNew,
	}
	if err := h.repo.Create(lead); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save")
		return
	}
	respondJSON(w, http.StatusCreated, map[string]bool{"ok": true})
}
