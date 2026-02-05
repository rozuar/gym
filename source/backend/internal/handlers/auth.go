package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"boxmagic/internal/config"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
	"boxmagic/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(db *sql.DB, cfg *config.Config) *AuthHandler {
	userRepo := repository.NewUserRepository(db)
	authService := services.NewAuthService(userRepo, cfg)
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		respondError(w, http.StatusBadRequest, "Email, password and name are required")
		return
	}

	resp, err := h.authService.Register(&req)
	if err != nil {
		if err == services.ErrUserExists {
			respondError(w, http.StatusConflict, "User already exists")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to register user")
		return
	}

	respondJSON(w, http.StatusCreated, resp)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	resp, err := h.authService.Login(&req)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	respondJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req models.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	resp, err := h.authService.Refresh(req.RefreshToken)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	respondJSON(w, http.StatusOK, resp)
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
