package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type PlanHandler struct {
	planRepo repository.PlanRepo
}

func NewPlanHandler(planRepo repository.PlanRepo) *PlanHandler {
	return &PlanHandler{
		planRepo: planRepo,
	}
}

func (h *PlanHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePlanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" || req.Price <= 0 || req.Duration <= 0 {
		respondError(w, http.StatusBadRequest, "Name, price and duration are required")
		return
	}

	if req.Currency == "" {
		req.Currency = "CLP"
	}

	plan := &models.Plan{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Currency:    req.Currency,
		Duration:    req.Duration,
		MaxClasses:  req.MaxClasses,
		Active:      true,
	}

	if err := h.planRepo.Create(plan); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create plan")
		return
	}

	respondJSON(w, http.StatusCreated, plan)
}

func (h *PlanHandler) List(w http.ResponseWriter, r *http.Request) {
	activeOnly := r.URL.Query().Get("active") != "false"

	plans, err := h.planRepo.List(activeOnly)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch plans")
		return
	}

	if plans == nil {
		plans = []*models.Plan{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"plans": plans,
	})
}

func (h *PlanHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid plan ID")
		return
	}

	plan, err := h.planRepo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Plan not found")
		return
	}

	respondJSON(w, http.StatusOK, plan)
}

func (h *PlanHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid plan ID")
		return
	}

	var req models.UpdatePlanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	plan, err := h.planRepo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Plan not found")
		return
	}

	if req.Name != "" {
		plan.Name = req.Name
	}
	if req.Description != "" {
		plan.Description = req.Description
	}
	if req.Price != nil {
		plan.Price = *req.Price
	}
	if req.Duration != nil {
		plan.Duration = *req.Duration
	}
	if req.MaxClasses != nil {
		plan.MaxClasses = *req.MaxClasses
	}
	if req.Active != nil {
		plan.Active = *req.Active
	}

	if err := h.planRepo.Update(plan); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update plan")
		return
	}

	respondJSON(w, http.StatusOK, plan)
}

func (h *PlanHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid plan ID")
		return
	}

	if err := h.planRepo.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete plan")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
