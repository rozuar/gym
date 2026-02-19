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

type NutritionHandler struct {
	repo *repository.NutritionRepository
}

func NewNutritionHandler(repo *repository.NutritionRepository) *NutritionHandler {
	return &NutritionHandler{repo: repo}
}

func (h *NutritionHandler) today() string {
	return time.Now().UTC().Format("2006-01-02")
}

func (h *NutritionHandler) GetDay(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	date := r.URL.Query().Get("date")
	if date == "" {
		date = h.today()
	}
	logs, err := h.repo.ListByDate(userID, date)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch logs")
		return
	}
	if logs == nil {
		logs = []*models.NutritionLog{}
	}
	summary, err := h.repo.GetSummary(userID, date)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch summary")
		return
	}
	water, err := h.repo.ListWaterByDate(userID, date)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch water")
		return
	}
	if water == nil {
		water = []*models.WaterLog{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"logs": logs, "summary": summary, "water": water,
	})
}

func (h *NutritionHandler) LogFood(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var req models.CreateNutritionLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.FoodName == "" {
		respondError(w, http.StatusBadRequest, "food_name is required")
		return
	}
	if req.MealType == "" {
		req.MealType = "other"
	}
	if req.LoggedAt == "" {
		req.LoggedAt = h.today()
	}
	l := &models.NutritionLog{
		UserID: userID, FoodName: req.FoodName,
		Grams: req.Grams, Calories: req.Calories,
		ProteinG: req.ProteinG, CarbsG: req.CarbsG, FatG: req.FatG,
		MealType: req.MealType, LoggedAt: req.LoggedAt,
	}
	if err := h.repo.LogFood(l); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to log food")
		return
	}
	respondJSON(w, http.StatusCreated, l)
}

func (h *NutritionHandler) DeleteLog(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	if err := h.repo.DeleteLog(id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete log")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *NutritionHandler) LogWater(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var req struct {
		ML       int    `json:"ml"`
		LoggedAt string `json:"logged_at"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ML <= 0 {
		respondError(w, http.StatusBadRequest, "ml must be > 0")
		return
	}
	if req.LoggedAt == "" {
		req.LoggedAt = h.today()
	}
	if err := h.repo.LogWater(userID, req.ML, req.LoggedAt); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to log water")
		return
	}
	respondJSON(w, http.StatusCreated, map[string]bool{"logged": true})
}

func (h *NutritionHandler) DeleteWater(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	if err := h.repo.DeleteWaterLog(id, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete water log")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
