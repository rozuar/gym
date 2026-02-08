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

	if err := tx.Commit(); err != nil {
		return err
	}

	log.Println("Seed data created successfully")
	log.Println("  Admin: admin@boxmagic.cl / admin123")
	log.Println("  User:  user@boxmagic.cl / user123")
	return nil
}
