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
	paymentRepo  repository.PaymentRepo
	planRepo     repository.PlanRepo
	userRepo     repository.UserRepo
	discountRepo *repository.DiscountCodeRepository
}

func NewPaymentHandler(paymentRepo repository.PaymentRepo, planRepo repository.PlanRepo, userRepo repository.UserRepo) *PaymentHandler {
	return &PaymentHandler{
		paymentRepo: paymentRepo,
		planRepo:    planRepo,
		userRepo:    userRepo,
	}
}

func (h *PaymentHandler) SetDiscountRepo(repo *repository.DiscountCodeRepository) {
	h.discountRepo = repo
}

// Create - Solo admin registra pagos (efectivo, débito, transferencia). Transferencia requiere proof_image_url.
func (h *PaymentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.UserID <= 0 || req.PlanID <= 0 {
		respondError(w, http.StatusBadRequest, "user_id and plan_id are required")
		return
	}

	// Validar método de pago: efectivo, debito, transferencia
	if !models.ValidPaymentMethods[req.PaymentMethod] {
		respondError(w, http.StatusBadRequest, "payment_method must be efectivo, debito or transferencia")
		return
	}
	if req.PaymentMethod == models.PaymentMethodTransferencia && req.ProofImageURL == "" {
		respondError(w, http.StatusBadRequest, "proof_image_url is required for transferencia")
		return
	}

	user, err := h.userRepo.GetByID(req.UserID)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
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

	// Determine effective price: trial or regular
	effectivePrice := plan.Price
	if plan.TrialPrice > 0 && plan.TrialDays > 0 {
		// Eligible if user registered within TrialDays and has no prior subscriptions
		daysSinceReg := int(time.Since(user.CreatedAt).Hours() / 24)
		if daysSinceReg <= plan.TrialDays {
			existing, _ := h.paymentRepo.GetActiveSubscription(req.UserID)
			if existing == nil {
				effectivePrice = plan.TrialPrice
			}
		}
	}

	// Apply discount code if provided
	var discountCodeID int64
	if req.DiscountCode != "" && h.discountRepo != nil {
		dc, dcErr := h.discountRepo.Validate(req.DiscountCode)
		if dcErr != nil {
			respondError(w, http.StatusBadRequest, "Invalid or expired discount code")
			return
		}
		effectivePrice = dc.ApplyDiscount(effectivePrice)
		discountCodeID = dc.ID
	}

	payment := &models.Payment{
		UserID:        req.UserID,
		PlanID:        plan.ID,
		Amount:        effectivePrice,
		Currency:      plan.Currency,
		Status:        models.PaymentCompleted,
		PaymentMethod: req.PaymentMethod,
		ProofImageURL: req.ProofImageURL,
	}
	_ = discountCodeID

	if err := h.paymentRepo.Create(payment); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create payment")
		return
	}

	// Increment discount code uses
	if discountCodeID > 0 && h.discountRepo != nil {
		_ = h.discountRepo.IncrementUses(discountCodeID)
	}

	startDate := time.Now()
	endDate := startDate.AddDate(0, 0, plan.Duration)

	subscription := &models.Subscription{
		UserID:         req.UserID,
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

func (h *PaymentHandler) FreezeSubscription(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.FreezeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	frozenUntil, err := time.Parse("2006-01-02", req.FreezeUntil)
	if err != nil {
		respondError(w, http.StatusBadRequest, "freeze_until must be YYYY-MM-DD")
		return
	}

	if !frozenUntil.After(time.Now()) {
		respondError(w, http.StatusBadRequest, "freeze_until must be a future date")
		return
	}

	maxFreeze := time.Now().AddDate(0, 3, 0)
	if frozenUntil.After(maxFreeze) {
		respondError(w, http.StatusBadRequest, "Maximum freeze period is 3 months")
		return
	}

	if err := h.paymentRepo.FreezeSubscription(userID, frozenUntil); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to freeze subscription")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":      "Subscription frozen",
		"frozen_until": req.FreezeUntil,
	})
}

func (h *PaymentHandler) UnfreezeSubscription(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	if err := h.paymentRepo.UnfreezeSubscription(userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to unfreeze subscription")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Subscription unfrozen",
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
