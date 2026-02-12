package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS_Headers(t *testing.T) {
	handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatal("missing CORS origin header")
	}
	if rr.Header().Get("Access-Control-Allow-Methods") == "" {
		t.Fatal("missing CORS methods header")
	}
	if rr.Header().Get("Access-Control-Allow-Headers") == "" {
		t.Fatal("missing CORS headers header")
	}
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestCORS_OPTIONS(t *testing.T) {
	called := false
	handler := CORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	}))

	req := httptest.NewRequest("OPTIONS", "/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if called {
		t.Fatal("next handler should not be called for OPTIONS")
	}
}

func TestLogger(t *testing.T) {
	handler := Logger(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
