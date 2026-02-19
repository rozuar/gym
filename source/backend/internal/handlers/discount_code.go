package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type DiscountCodeHandler struct {
	repo *repository.DiscountCodeRepository
}

func NewDiscountCodeHandler(repo *repository.DiscountCodeRepository) *DiscountCodeHandler {
	return &DiscountCodeHandler{repo: repo}
}

func (h *DiscountCodeHandler) List(w http.ResponseWriter, r *http.Request) {
	codes, err := h.repo.List(false)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch discount codes")
		return
	}
	if codes == nil {
		codes = []*models.DiscountCode{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"codes": codes})
}

func (h *DiscountCodeHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateDiscountCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Code == "" {
		respondError(w, http.StatusBadRequest, "code is required")
		return
	}
	if req.DiscountType != models.DiscountTypePercent && req.DiscountType != models.DiscountTypeAmount {
		respondError(w, http.StatusBadRequest, "discount_type must be 'percent' or 'amount'")
		return
	}
	if req.DiscountValue <= 0 {
		respondError(w, http.StatusBadRequest, "discount_value must be positive")
		return
	}
	if req.DiscountType == models.DiscountTypePercent && req.DiscountValue > 100 {
		respondError(w, http.StatusBadRequest, "percent discount cannot exceed 100")
		return
	}

	code := &models.DiscountCode{
		Code:          req.Code,
		Description:   req.Description,
		DiscountType:  req.DiscountType,
		DiscountValue: req.DiscountValue,
		MaxUses:       req.MaxUses,
		Active:        true,
	}
	if req.ValidUntil != nil && *req.ValidUntil != "" {
		t, err := time.Parse("2006-01-02", *req.ValidUntil)
		if err != nil {
			respondError(w, http.StatusBadRequest, "valid_until must be YYYY-MM-DD")
			return
		}
		code.ValidUntil = &t
	}

	if err := h.repo.Create(code); err != nil {
		respondError(w, http.StatusConflict, "Code already exists")
		return
	}
	respondJSON(w, http.StatusCreated, code)
}

func (h *DiscountCodeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid code ID")
		return
	}
	if err := h.repo.Delete(id); err != nil {
		respondError(w, http.StatusNotFound, "Code not found")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "Code deactivated"})
}

// Validate is called by admin before creating a payment.
// Returns discount info if valid, 404 if not found/expired/exhausted.
func (h *DiscountCodeHandler) Validate(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		respondError(w, http.StatusBadRequest, "code query param required")
		return
	}

	dc, err := h.repo.Validate(code)
	if err == sql.ErrNoRows || dc == nil {
		respondError(w, http.StatusNotFound, "Invalid or expired discount code")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to validate code")
		return
	}

	respondJSON(w, http.StatusOK, &models.ValidateDiscountResponse{
		Code:          dc.Code,
		DiscountType:  dc.DiscountType,
		DiscountValue: dc.DiscountValue,
		Description:   dc.Description,
	})
}
