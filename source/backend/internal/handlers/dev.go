package handlers

import (
	"database/sql"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"boxmagic/internal/config"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

const devEnv = "development"

// SeedTestUsers creates or resets the test users (admin@boxmagic.cl, user@boxmagic.cl).
// Only available when API_ENV=development.
func SeedTestUsers(db *sql.DB, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if cfg.Environment != devEnv {
			respondError(w, http.StatusForbidden, "Only available in development")
			return
		}

		userRepo := repository.NewUserRepository(db)

		// Remove existing test users so they are re-created with known passwords
		_ = userRepo.DeleteByEmail("admin@boxmagic.cl")
		_ = userRepo.DeleteByEmail("user@boxmagic.cl")

		adminHash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create admin user")
			return
		}
		userHash, err := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create test user")
			return
		}

		admin := &models.User{
			Email:        "admin@boxmagic.cl",
			PasswordHash: string(adminHash),
			Name:         "Administrador",
			Role:         models.RoleAdmin,
			Active:       true,
		}
		if err := userRepo.Create(admin); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create admin user")
			return
		}

		user := &models.User{
			Email:        "user@boxmagic.cl",
			PasswordHash: string(userHash),
			Name:         "Usuario Demo",
			Role:         models.RoleUser,
			Active:       true,
		}
		if err := userRepo.Create(user); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create test user")
			return
		}

		respondJSON(w, http.StatusOK, map[string]string{
			"message": "Usuarios de prueba creados",
			"admin":   "admin@boxmagic.cl / admin123",
			"user":    "user@boxmagic.cl / user123",
		})
	}
}
