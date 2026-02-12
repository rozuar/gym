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

type PaymentHandler struct {
	paymentRepo repository.PaymentRepo
	planRepo    repository.PlanRepo
}

func NewPaymentHandler(paymentRepo repository.PaymentRepo, planRepo repository.PlanRepo) *PaymentHandler {
	return &PaymentHandler{
		paymentRepo: paymentRepo,
		planRepo:    planRepo,
	}
}

func (h *PaymentHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.CreatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.PlanID <= 0 {
		respondError(w, http.StatusBadRequest, "Plan ID is required")
		return
	}

	plan, err := h.planRepo.GetByID(req.PlanID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Plan not found")
		return
	}

	if !plan.Active {
		respondError(w, http.StatusBadRequest, "Plan is not active")
		return
	}

	payment := &models.Payment{
		UserID:        userID,
		PlanID:        plan.ID,
		Amount:        plan.Price,
		Currency:      plan.Currency,
		Status:        models.PaymentPending,
		PaymentMethod: req.PaymentMethod,
	}

	if err := h.paymentRepo.Create(payment); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create payment")
		return
	}

	if err := h.paymentRepo.UpdateStatus(payment.ID, models.PaymentCompleted); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to process payment")
		return
	}
	payment.Status = models.PaymentCompleted

	startDate := time.Now()
	endDate := startDate.AddDate(0, 0, plan.Duration)

	subscription := &models.Subscription{
		UserID:         userID,
		PlanID:         plan.ID,
		PaymentID:      payment.ID,
		StartDate:      startDate,
		EndDate:        endDate,
		ClassesUsed:    0,
		ClassesAllowed: plan.MaxClasses,
		Active:         true,
	}

	if err := h.paymentRepo.CreateSubscription(subscription); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create subscription")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"payment":      payment,
		"subscription": subscription,
	})
}

func (h *PaymentHandler) MyPayments(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	limit := 20
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

	payments, err := h.paymentRepo.ListByUser(userID, limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch payments")
		return
	}

	if payments == nil {
		payments = []*models.PaymentWithDetails{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"payments": payments,
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *PaymentHandler) MySubscription(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	subscription, err := h.paymentRepo.GetActiveSubscription(userID)
	if err != nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"subscription": nil,
			"message":      "No active subscription",
		})
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"subscription": subscription,
	})
}

func (h *PaymentHandler) ListAll(w http.ResponseWriter, r *http.Request) {
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

	payments, err := h.paymentRepo.ListAll(limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch payments")
		return
	}

	if payments == nil {
		payments = []*models.PaymentWithDetails{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"payments": payments,
		"limit":    limit,
		"offset":   offset,
	})
}
