package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
)

type mockPaymentRepo struct {
	createErr                error
	updateStatusErr          error
	createSubscriptionErr    error
	listByUserErr            error
	listAllErr               error
	getActiveSubscription    *models.SubscriptionWithPlan
	getActiveSubscriptionErr error
}

func (m *mockPaymentRepo) Create(payment *models.Payment) error      { return m.createErr }
func (m *mockPaymentRepo) GetByID(id int64) (*models.Payment, error) { return nil, nil }
func (m *mockPaymentRepo) UpdateStatus(id int64, status models.PaymentStatus) error {
	return m.updateStatusErr
}
func (m *mockPaymentRepo) ListByUser(userID int64, limit, offset int) ([]*models.PaymentWithDetails, error) {
	if m.listByUserErr != nil {
		return nil, m.listByUserErr
	}
	return []*models.PaymentWithDetails{}, nil
}
func (m *mockPaymentRepo) ListAll(limit, offset int) ([]*models.PaymentWithDetails, error) {
	if m.listAllErr != nil {
		return nil, m.listAllErr
	}
	return []*models.PaymentWithDetails{}, nil
}
func (m *mockPaymentRepo) CreateSubscription(sub *models.Subscription) error {
	return m.createSubscriptionErr
}
func (m *mockPaymentRepo) GetActiveSubscription(userID int64) (*models.SubscriptionWithPlan, error) {
	return m.getActiveSubscription, m.getActiveSubscriptionErr
}
func (m *mockPaymentRepo) IncrementClassesUsed(subscriptionID int64) error { return nil }
func (m *mockPaymentRepo) DeactivateExpiredSubscriptions() error           { return nil }

type mockPlanRepo struct {
	getByIDPlan *models.Plan
	getByIDErr  error
}

func (m *mockPlanRepo) Create(plan *models.Plan) error               { return nil }
func (m *mockPlanRepo) GetByID(id int64) (*models.Plan, error)       { return m.getByIDPlan, m.getByIDErr }
func (m *mockPlanRepo) List(activeOnly bool) ([]*models.Plan, error) { return nil, nil }
func (m *mockPlanRepo) Update(plan *models.Plan) error               { return nil }
func (m *mockPlanRepo) Delete(id int64) error                        { return nil }

func requestWithAuth(r *http.Request, userID int64) *http.Request {
	ctx := middleware.WithAuth(r.Context(), userID, models.RoleUser)
	return r.WithContext(ctx)
}

func TestPaymentHandler_Create_InvalidBody(t *testing.T) {
	paymentRepo := &mockPaymentRepo{}
	planRepo := &mockPlanRepo{}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.Create(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestPaymentHandler_Create_PlanIDRequired(t *testing.T) {
	paymentRepo := &mockPaymentRepo{}
	planRepo := &mockPlanRepo{}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	body := `{"payment_method":"card"}`
	req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.Create(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestPaymentHandler_Create_PlanNotFound(t *testing.T) {
	paymentRepo := &mockPaymentRepo{}
	planRepo := &mockPlanRepo{getByIDErr: errors.New("not found")}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	body := `{"plan_id":999,"payment_method":"card"}`
	req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.Create(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}

func TestPaymentHandler_Create_PlanInactive(t *testing.T) {
	plan := &models.Plan{ID: 1, Name: "Test", Price: 10000, Currency: "CLP", Duration: 30, MaxClasses: 0, Active: false}
	paymentRepo := &mockPaymentRepo{}
	planRepo := &mockPlanRepo{getByIDPlan: plan}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	body := `{"plan_id":1,"payment_method":"card"}`
	req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.Create(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestPaymentHandler_Create_Success(t *testing.T) {
	plan := &models.Plan{ID: 1, Name: "Test", Price: 10000, Currency: "CLP", Duration: 30, MaxClasses: 0, Active: true}
	paymentRepo := &mockPaymentRepo{}
	planRepo := &mockPlanRepo{getByIDPlan: plan}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	body := `{"plan_id":1,"payment_method":"card"}`
	req := httptest.NewRequest("POST", "/api/v1/payments", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.Create(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	var result map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&result); err != nil {
		t.Fatal(err)
	}
	if result["payment"] == nil || result["subscription"] == nil {
		t.Fatalf("expected payment and subscription in response")
	}
}

func TestPaymentHandler_MyPayments_Success(t *testing.T) {
	paymentRepo := &mockPaymentRepo{}
	planRepo := &mockPlanRepo{}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	req := httptest.NewRequest("GET", "/api/v1/payments/me", nil)
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.MyPayments(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestPaymentHandler_MySubscription_NoActive(t *testing.T) {
	paymentRepo := &mockPaymentRepo{getActiveSubscriptionErr: errors.New("none")}
	planRepo := &mockPlanRepo{}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	req := httptest.NewRequest("GET", "/api/v1/subscriptions/me", nil)
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.MySubscription(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	var result map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&result); err != nil {
		t.Fatal(err)
	}
	if result["subscription"] != nil {
		t.Fatalf("expected nil subscription when none active")
	}
}

func TestPaymentHandler_MySubscription_WithActive(t *testing.T) {
	sub := &models.SubscriptionWithPlan{
		Subscription: models.Subscription{ID: 1, UserID: 1, PlanID: 1, Active: true, EndDate: time.Now().AddDate(0, 1, 0)},
		PlanName:     "Mensual",
		PlanPrice:    45000,
	}
	paymentRepo := &mockPaymentRepo{getActiveSubscription: sub}
	planRepo := &mockPlanRepo{}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	req := httptest.NewRequest("GET", "/api/v1/subscriptions/me", nil)
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.MySubscription(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestPaymentHandler_ListAll_Success(t *testing.T) {
	paymentRepo := &mockPaymentRepo{}
	planRepo := &mockPlanRepo{}
	handler := NewPaymentHandler(paymentRepo, planRepo)

	req := httptest.NewRequest("GET", "/api/v1/payments", nil)
	req = requestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.ListAll(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
