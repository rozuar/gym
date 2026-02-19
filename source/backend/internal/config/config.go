package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port                  string
	DatabaseURL           string
	JWTSecret             string
	JWTExpiry             time.Duration
	RefreshTokenExpiry    time.Duration
	Environment           string
	InvitationClassPrice  int64 // Valor CLP de 1 clase invitación (variable global)
	BeforeClassPhotoPrice int64 // Costo adicional CLP por foto antes de clase/rutina

	// Booking window
	BookingWindowDays  int // Cuántos días antes se puede reservar (0 = sin límite)
	BookingCutoffHours int // Cuántas horas antes se cierra la reserva (0 = sin límite)

	// Upload
	UploadDir string
	BaseURL   string

	// SMTP
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPass     string
	SMTPFrom     string
	EmailEnabled bool
}

func Load() *Config {
	port := getEnv("PORT", getEnv("API_PORT", "8080"))
	bookingWindow, _ := strconv.Atoi(getEnv("BOOKING_WINDOW_DAYS", "7"))
	bookingCutoff, _ := strconv.Atoi(getEnv("BOOKING_CUTOFF_HOURS", "1"))
	invPrice, _ := strconv.ParseInt(getEnv("INVITATION_CLASS_PRICE", "15000"), 10, 64)
	if invPrice <= 0 {
		invPrice = 15000
	}
	photoPrice, _ := strconv.ParseInt(getEnv("BEFORE_CLASS_PHOTO_PRICE", "5000"), 10, 64)
	if photoPrice < 0 {
		photoPrice = 5000
	}
	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))

	return &Config{
		Port:                  port,
		DatabaseURL:           getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/boxmagic?sslmode=disable"),
		JWTSecret:             getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		JWTExpiry:             parseDuration(getEnv("JWT_EXPIRY", "24h")),
		RefreshTokenExpiry:    parseDuration(getEnv("REFRESH_TOKEN_EXPIRY", "168h")),
		Environment:           getEnv("API_ENV", "development"),
		InvitationClassPrice:  invPrice,
		BeforeClassPhotoPrice: photoPrice,
		BookingWindowDays:     bookingWindow,
		BookingCutoffHours:    bookingCutoff,
		UploadDir:             getEnv("UPLOAD_DIR", "./uploads"),
		BaseURL:               getEnv("BASE_URL", "http://localhost:"+port),
		SMTPHost:              getEnv("SMTP_HOST", ""),
		SMTPPort:              smtpPort,
		SMTPUser:              getEnv("SMTP_USER", ""),
		SMTPPass:              getEnv("SMTP_PASS", ""),
		SMTPFrom:              getEnv("SMTP_FROM", "Box Magic <noreply@boxmagic.cl>"),
		EmailEnabled:          getEnv("EMAIL_ENABLED", "false") == "true",
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
