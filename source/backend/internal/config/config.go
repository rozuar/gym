package config

import (
	"os"
	"time"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	JWTExpiry          time.Duration
	RefreshTokenExpiry time.Duration
	Environment        string
}

func Load() *Config {
	// Railway uses PORT, but we also support API_PORT for flexibility
	port := getEnv("PORT", getEnv("API_PORT", "8080"))

	return &Config{
		Port:               port,
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/boxmagic?sslmode=disable"),
		JWTSecret:          getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		JWTExpiry:          parseDuration(getEnv("JWT_EXPIRY", "24h")),
		RefreshTokenExpiry: parseDuration(getEnv("REFRESH_TOKEN_EXPIRY", "168h")),
		Environment:        getEnv("API_ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 24 * time.Hour
	}
	return d
}
