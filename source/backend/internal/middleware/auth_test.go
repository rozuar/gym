package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"boxmagic/internal/config"
	"boxmagic/internal/models"
)

func makeJWT(secret string, claims jwt.MapClaims) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, _ := token.SignedString([]byte(secret))
	return s
}

func TestAuth_ValidToken(t *testing.T) {
	cfg := &config.Config{JWTSecret: "test-secret"}
	token := makeJWT("test-secret", jwt.MapClaims{
		"sub":  float64(42),
		"role": "admin",
		"exp":  time.Now().Add(time.Hour).Unix(),
	})

	var gotID int64
	var gotRole models.Role
	handler := Auth(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotID = GetUserID(r.Context())
		gotRole = GetRole(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if gotID != 42 {
		t.Fatalf("expected userID 42, got %d", gotID)
	}
	if gotRole != models.RoleAdmin {
		t.Fatalf("expected role admin, got %s", gotRole)
	}
}

func TestAuth_MissingHeader(t *testing.T) {
	cfg := &config.Config{JWTSecret: "test-secret"}
	handler := Auth(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not reach handler")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestAuth_InvalidFormat(t *testing.T) {
	cfg := &config.Config{JWTSecret: "test-secret"}
	handler := Auth(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not reach handler")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Token abc")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestAuth_ExpiredToken(t *testing.T) {
	cfg := &config.Config{JWTSecret: "test-secret"}
	token := makeJWT("test-secret", jwt.MapClaims{
		"sub":  float64(1),
		"role": "user",
		"exp":  time.Now().Add(-time.Hour).Unix(),
	})

	handler := Auth(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not reach handler")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestAuth_WrongSecret(t *testing.T) {
	cfg := &config.Config{JWTSecret: "test-secret"}
	token := makeJWT("wrong-secret", jwt.MapClaims{
		"sub":  float64(1),
		"role": "user",
		"exp":  time.Now().Add(time.Hour).Unix(),
	})

	handler := Auth(cfg)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not reach handler")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}
}

func TestAdminOnly_Admin(t *testing.T) {
	handler := AdminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	ctx := WithAuth(req.Context(), 1, models.RoleAdmin)
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestAdminOnly_User(t *testing.T) {
	handler := AdminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("should not reach handler")
	}))

	req := httptest.NewRequest("GET", "/", nil)
	ctx := WithAuth(req.Context(), 1, models.RoleUser)
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestGetUserID_NoContext(t *testing.T) {
	id := GetUserID(context.Background())
	if id != 0 {
		t.Fatalf("expected 0, got %d", id)
	}
}

func TestGetRole_NoContext(t *testing.T) {
	role := GetRole(context.Background())
	if role != "" {
		t.Fatalf("expected empty, got %s", role)
	}
}

func TestWithAuth(t *testing.T) {
	ctx := WithAuth(context.Background(), 99, models.RoleAdmin)
	if GetUserID(ctx) != 99 {
		t.Fatal("expected 99")
	}
	if GetRole(ctx) != models.RoleAdmin {
		t.Fatal("expected admin")
	}
}
