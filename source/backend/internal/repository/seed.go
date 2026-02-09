package repository

import (
	"database/sql"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func Seed(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	log.Println("Database is empty, seeding test data...")

	adminHash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	userHash, err := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Create admin user
	_, err = tx.Exec(`
		INSERT INTO users (email, password_hash, name, phone, role, active)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		"admin@boxmagic.cl", string(adminHash), "Administrador", "", "admin", true,
	)
	if err != nil {
		return err
	}

	// Create regular user
	_, err = tx.Exec(`
		INSERT INTO users (email, password_hash, name, phone, role, active)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		"user@boxmagic.cl", string(userHash), "Usuario Demo", "", "user", true,
	)
	if err != nil {
		return err
	}

	// Create disciplines
	_, err = tx.Exec(`
		INSERT INTO disciplines (name, description, color, active) VALUES
		('CrossFit', 'Entrenamiento funcional de alta intensidad', '#FF6B35', true),
		('Halterofilia', 'Levantamiento olimpico de pesas', '#4ECDC4', true),
		('Gimnasia', 'Gimnasia deportiva y calistenia', '#45B7D1', true)`)
	if err != nil {
		return err
	}

	// Create plans
	_, err = tx.Exec(`
		INSERT INTO plans (name, description, price, duration, max_classes, active) VALUES
		('Plan Mensual', 'Acceso ilimitado por 30 dias', 45000, 30, 0, true),
		('Plan 12 Clases', '12 clases en 30 dias', 35000, 30, 12, true),
		('Plan 8 Clases', '8 clases en 30 dias', 28000, 30, 8, true)`)
	if err != nil {
		return err
	}

	// Get admin user ID for routines
	var adminID int64
	err = tx.QueryRow("SELECT id FROM users WHERE email = $1", "admin@boxmagic.cl").Scan(&adminID)
	if err != nil {
		return err
	}

	// Create routines
	_, err = tx.Exec(`
		INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active) VALUES
		('Fran', '21-15-9', 'wod', 'Thruster 43kg, Pull-ups', 10, 'rx', $1, true),
		('Cindy', 'AMRAP 20 min', 'wod', '5 Pull-ups, 10 Push-ups, 15 Air Squats', 20, 'intermediate', $1, true),
		('Helen', '3 rondas', 'wod', '400m run, 21 KB swing 24kg, 12 Pull-ups', 12, 'intermediate', $1, true),
		('Grace', 'For time', 'wod', '30 Clean & Jerk 43kg', 5, 'rx', $1, true),
		('Murph', 'For time', 'wod', '1 mile run, 100 Pull-ups, 200 Push-ups, 300 Air Squats, 1 mile run', 45, 'rx', $1, true),
		('Fuerza A', 'Back Squat', 'strength', '5x5 Back Squat @ 80%', 45, 'intermediate', $1, true),
		('Skill Work', 'Muscle-up Progression', 'skill', '3 rounds: 5 strict pull-ups, 5 ring dips, 5 muscle-up transitions', 20, 'intermediate', $1, true),
		('Cardio', 'Running Intervals', 'cardio', '5 rounds: 400m run @ 80%, 2min rest', 25, 'beginner', $1, true)`,
		adminID)
	if err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	log.Println("Seed data created successfully")
	log.Println("  Admin: admin@boxmagic.cl / admin123")
	log.Println("  User:  user@boxmagic.cl / user123")
	return nil
}
