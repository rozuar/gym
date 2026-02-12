package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"boxmagic/internal/models"
	"boxmagic/internal/services"
)

type mockAuthService struct {
	registerResp *models.AuthResponse
	registerErr  error
	loginResp    *models.AuthResponse
	loginErr     error
	refreshResp  *models.AuthResponse
	refreshErr   error
}

func (m *mockAuthService) Register(req *models.RegisterRequest) (*models.AuthResponse, error) {
	return m.registerResp, m.registerErr
}

func (m *mockAuthService) Login(req *models.LoginRequest) (*models.AuthResponse, error) {
	return m.loginResp, m.loginErr
}

func (m *mockAuthService) Refresh(refreshToken string) (*models.AuthResponse, error) {
	return m.refreshResp, m.refreshErr
}

func TestAuthHandler_Register_Success(t *testing.T) {
	user := &models.User{ID: 1, Email: "test@test.com", Name: "Test", Role: models.RoleUser}
	resp := &models.AuthResponse{AccessToken: "token", RefreshToken: "refresh", User: user}
	mock := &mockAuthService{registerResp: resp}
	handler := NewAuthHandler(mock)

	body := `{"email":"test@test.com","password":"secret123","name":"Test User"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Register(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	var result models.AuthResponse
	if err := json.NewDecoder(rr.Body).Decode(&result); err != nil {
		t.Fatal(err)
	}
	if result.AccessToken != "token" || result.User.Email != "test@test.com" {
		t.Fatalf("unexpected response: %+v", result)
	}
}

func TestAuthHandler_Register_InvalidBody(t *testing.T) {
	mock := &mockAuthService{}
	handler := NewAuthHandler(mock)

	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Register(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestAuthHandler_Register_MissingFields(t *testing.T) {
	mock := &mockAuthService{}
	handler := NewAuthHandler(mock)

	body := `{"email":"test@test.com"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Register(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestAuthHandler_Register_UserExists(t *testing.T) {
	mock := &mockAuthService{registerErr: services.ErrUserExists}
	handler := NewAuthHandler(mock)

	body := `{"email":"test@test.com","password":"secret123","name":"Test User"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Register(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", rr.Code)
	}
}

func TestAuthHandler_Login_Success(t *testing.T) {
	user := &models.User{ID: 1, Email: "test@test.com", Name: "Test", Role: models.RoleUser}
	resp := &models.AuthResponse{AccessToken: "token", RefreshToken: "refresh", User: user}
	mock := &mockAuthService{loginResp: resp}
	handler := NewAuthHandler(mock)

	body := `{"email":"test@test.com","password":"secret123"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Login(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestAuthHandler_Login_InvalidBody(t *testing.T) {
	mock := &mockAuthService{}
	handler := NewAuthHandler(mock)

	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Login(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	mock := &mockAuthService{loginErr: services.ErrInvalidCredentials}
	handler := NewAuthHandler(mock)

	body := `{"email":"test@test.com","password":"wrong"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Login(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestAuthHandler_Refresh_Success(t *testing.T) {
	user := &models.User{ID: 1, Email: "test@test.com", Name: "Test", Role: models.RoleUser}
	resp := &models.AuthResponse{AccessToken: "new-token", RefreshToken: "new-refresh", User: user}
	mock := &mockAuthService{refreshResp: resp}
	handler := NewAuthHandler(mock)

	body := `{"refresh_token":"old-refresh-token"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Refresh(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestAuthHandler_Refresh_InvalidBody(t *testing.T) {
	mock := &mockAuthService{}
	handler := NewAuthHandler(mock)

	req := httptest.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Refresh(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestAuthHandler_Refresh_InvalidToken(t *testing.T) {
	mock := &mockAuthService{refreshErr: services.ErrInvalidToken}
	handler := NewAuthHandler(mock)

	body := `{"refresh_token":"invalid-token"}`
	req := httptest.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.Refresh(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}
