package repository

import (
	"database/sql"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// SeedInstructors ensures default instructors exist in the database
func SeedInstructors(db *sql.DB) error {
	var instructorCount int
	err := db.QueryRow("SELECT COUNT(*) FROM instructors").Scan(&instructorCount)
	if err != nil {
		return err
	}
	if instructorCount > 0 {
		return nil // Instructors already exist
	}

	log.Println("No instructors found, seeding default instructors...")

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Create instructors
	instructors := []struct {
		name, email, phone, specialty, bio string
	}{
		{"Juan Pérez", "juan@boxmagic.cl", "+56912345678", "CrossFit", "Instructor certificado CrossFit Level 1"},
		{"María González", "maria@boxmagic.cl", "+56987654321", "Halterofilia", "Especialista en levantamiento olímpico"},
		{"Carlos Rodríguez", "carlos@boxmagic.cl", "+56911223344", "Gimnasia", "Experto en gimnasia y calistenia"},
	}

	for _, inst := range instructors {
		var exists int
		err = tx.QueryRow("SELECT COUNT(*) FROM instructors WHERE name = $1", inst.name).Scan(&exists)
		if err != nil {
			continue
		}
		if exists == 0 {
			_, err = tx.Exec(`
				INSERT INTO instructors (name, email, phone, specialty, bio, active)
				VALUES ($1, $2, $3, $4, $5, true)`,
				inst.name, inst.email, inst.phone, inst.specialty, inst.bio)
			if err != nil {
				log.Printf("Warning: Failed to insert instructor %s: %v", inst.name, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	log.Println("Default instructors seeded successfully")
	return nil
}

// SeedRoutines ensures default routines exist in the database
func SeedRoutines(db *sql.DB) error {
	var routineCount int
	err := db.QueryRow("SELECT COUNT(*) FROM routines").Scan(&routineCount)
	if err != nil {
		return err
	}
	if routineCount > 0 {
		return nil // Routines already exist
	}

	log.Println("No routines found, seeding default routines...")

	// Get or create admin user for routines
	var adminID int64
	err = db.QueryRow("SELECT id FROM users WHERE email = $1", "admin@boxmagic.cl").Scan(&adminID)
	if err != nil {
		// If admin doesn't exist, try to get any admin user
		err = db.QueryRow("SELECT id FROM users WHERE role = 'admin' LIMIT 1").Scan(&adminID)
		if err != nil {
			// If no admin exists, create a temporary one (or use 0 if allowed)
			// For now, we'll skip routines if no admin exists
			log.Println("Warning: No admin user found, skipping routine seed")
			return nil
		}
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Create routines (check if each exists before inserting)
	routines := []struct {
		name, desc, rtype, content string
		duration                   int
		difficulty                 string
	}{
		{"Fran", "21-15-9", "wod", "Thruster 43kg, Pull-ups", 10, "rx"},
		{"Cindy", "AMRAP 20 min", "wod", "5 Pull-ups, 10 Push-ups, 15 Air Squats", 20, "intermediate"},
		{"Helen", "3 rondas", "wod", "400m run, 21 KB swing 24kg, 12 Pull-ups", 12, "intermediate"},
		{"Grace", "For time", "wod", "30 Clean & Jerk 43kg", 5, "rx"},
		{"Murph", "For time", "wod", "1 mile run, 100 Pull-ups, 200 Push-ups, 300 Air Squats, 1 mile run", 45, "rx"},
		{"Fuerza A", "Back Squat", "strength", "5x5 Back Squat @ 80%", 45, "intermediate"},
		{"Skill Work", "Muscle-up Progression", "skill", "3 rounds: 5 strict pull-ups, 5 ring dips, 5 muscle-up transitions", 20, "intermediate"},
		{"Cardio", "Running Intervals", "cardio", "5 rounds: 400m run @ 80%, 2min rest", 25, "beginner"},
	}

	for _, r := range routines {
		var exists int
		err = tx.QueryRow("SELECT COUNT(*) FROM routines WHERE name = $1", r.name).Scan(&exists)
		if err != nil {
			continue
		}
		if exists == 0 {
			_, err = tx.Exec(`
				INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
				VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
				r.name, r.desc, r.rtype, r.content, r.duration, r.difficulty, adminID)
			if err != nil {
				log.Printf("Warning: Failed to insert routine %s: %v", r.name, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	log.Println("Default routines seeded successfully")
	return nil
}

// SeedClasses ensures default classes and schedules exist in the database
func SeedClasses(db *sql.DB) error {
	var classCount int
	err := db.QueryRow("SELECT COUNT(*) FROM classes").Scan(&classCount)
	if err != nil {
		return err
	}
	if classCount > 0 {
		return nil
	}

	log.Println("No classes found, seeding default classes and schedules...")

	// Resolve discipline IDs
	var dCross, dHalter, dGimnasia int64
	db.QueryRow("SELECT id FROM disciplines WHERE name = 'CrossFit' LIMIT 1").Scan(&dCross)
	db.QueryRow("SELECT id FROM disciplines WHERE name = 'Halterofilia' LIMIT 1").Scan(&dHalter)
	db.QueryRow("SELECT id FROM disciplines WHERE name = 'Gimnasia' LIMIT 1").Scan(&dGimnasia)

	if dCross == 0 || dHalter == 0 || dGimnasia == 0 {
		log.Println("Warning: Disciplines not found, skipping class seed")
		return nil
	}

	// Resolve instructor IDs
	var instJuan, instMaria, instCarlos int64
	db.QueryRow("SELECT id FROM instructors WHERE name = 'Juan Pérez' LIMIT 1").Scan(&instJuan)
	db.QueryRow("SELECT id FROM instructors WHERE name = 'María González' LIMIT 1").Scan(&instMaria)
	db.QueryRow("SELECT id FROM instructors WHERE name = 'Carlos Rodríguez' LIMIT 1").Scan(&instCarlos)

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	type classEntry struct {
		disciplineID             int64
		name, desc               string
		dayOfWeek                int
		startTime, endTime       string
		capacity                 int
		instructorID             int64
	}

	classes := []classEntry{
		// CrossFit — WOD 7AM (Lun-Vie)
		{dCross, "WOD 7AM", "CrossFit matutino - WOD del día", 1, "07:00", "08:00", 15, instJuan},
		{dCross, "WOD 7AM", "CrossFit matutino - WOD del día", 2, "07:00", "08:00", 15, instJuan},
		{dCross, "WOD 7AM", "CrossFit matutino - WOD del día", 3, "07:00", "08:00", 15, instJuan},
		{dCross, "WOD 7AM", "CrossFit matutino - WOD del día", 4, "07:00", "08:00", 15, instJuan},
		{dCross, "WOD 7AM", "CrossFit matutino - WOD del día", 5, "07:00", "08:00", 15, instJuan},
		// CrossFit — WOD 9AM (Lun-Vie)
		{dCross, "WOD 9AM", "CrossFit media mañana", 1, "09:00", "10:00", 12, instJuan},
		{dCross, "WOD 9AM", "CrossFit media mañana", 2, "09:00", "10:00", 12, instJuan},
		{dCross, "WOD 9AM", "CrossFit media mañana", 3, "09:00", "10:00", 12, instJuan},
		{dCross, "WOD 9AM", "CrossFit media mañana", 4, "09:00", "10:00", 12, instJuan},
		{dCross, "WOD 9AM", "CrossFit media mañana", 5, "09:00", "10:00", 12, instJuan},
		// CrossFit — WOD 12PM (Lun, Mie, Vie)
		{dCross, "WOD 12PM", "CrossFit mediodía", 1, "12:00", "13:00", 10, instJuan},
		{dCross, "WOD 12PM", "CrossFit mediodía", 3, "12:00", "13:00", 10, instJuan},
		{dCross, "WOD 12PM", "CrossFit mediodía", 5, "12:00", "13:00", 10, instJuan},
		// CrossFit — WOD 18PM (Lun-Vie)
		{dCross, "WOD 18PM", "CrossFit tarde - Horario peak", 1, "18:00", "19:00", 15, instJuan},
		{dCross, "WOD 18PM", "CrossFit tarde - Horario peak", 2, "18:00", "19:00", 15, instJuan},
		{dCross, "WOD 18PM", "CrossFit tarde - Horario peak", 3, "18:00", "19:00", 15, instJuan},
		{dCross, "WOD 18PM", "CrossFit tarde - Horario peak", 4, "18:00", "19:00", 15, instJuan},
		{dCross, "WOD 18PM", "CrossFit tarde - Horario peak", 5, "18:00", "19:00", 15, instJuan},
		// CrossFit — WOD 19:30PM (Lun-Jue)
		{dCross, "WOD 19:30PM", "CrossFit noche", 1, "19:30", "20:30", 12, instJuan},
		{dCross, "WOD 19:30PM", "CrossFit noche", 2, "19:30", "20:30", 12, instJuan},
		{dCross, "WOD 19:30PM", "CrossFit noche", 3, "19:30", "20:30", 12, instJuan},
		{dCross, "WOD 19:30PM", "CrossFit noche", 4, "19:30", "20:30", 12, instJuan},
		// CrossFit — Sábado
		{dCross, "WOD Sábado", "CrossFit sabatino - Team WOD", 6, "10:00", "11:30", 20, instJuan},
		// Halterofilia — Técnica (Mar, Jue)
		{dHalter, "Halterofilia Técnica", "Snatch y Clean & Jerk - Técnica y progresiones", 2, "10:00", "11:00", 8, instMaria},
		{dHalter, "Halterofilia Técnica", "Snatch y Clean & Jerk - Técnica y progresiones", 4, "10:00", "11:00", 8, instMaria},
		// Halterofilia — Fuerza (Mie, Vie)
		{dHalter, "Halterofilia Fuerza", "Back Squat, Front Squat, Deadlift - Ciclos de fuerza", 3, "17:00", "18:00", 8, instMaria},
		{dHalter, "Halterofilia Fuerza", "Back Squat, Front Squat, Deadlift - Ciclos de fuerza", 5, "17:00", "18:00", 8, instMaria},
		// Halterofilia — Sábado
		{dHalter, "Halterofilia Open", "Práctica libre con guía técnica", 6, "11:30", "12:30", 6, instMaria},
		// Gimnasia — Skill (Lun, Mie)
		{dGimnasia, "Gimnasia Skill", "Muscle-ups, handstand walks, ring work", 1, "10:00", "11:00", 10, instCarlos},
		{dGimnasia, "Gimnasia Skill", "Muscle-ups, handstand walks, ring work", 3, "10:00", "11:00", 10, instCarlos},
		// Gimnasia — Avanzada (Vie)
		{dGimnasia, "Gimnasia Avanzada", "Ring muscle-ups, deficit HSPU, freestanding HSW", 5, "10:00", "11:00", 8, instCarlos},
		// Calistenia (Mar, Jue)
		{dGimnasia, "Calistenia", "Progresiones de calistenia y control corporal", 2, "17:00", "18:00", 10, instCarlos},
		{dGimnasia, "Calistenia", "Progresiones de calistenia y control corporal", 4, "17:00", "18:00", 10, instCarlos},
	}

	for _, c := range classes {
		var classID int64
		err = tx.QueryRow(`
			INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
			VALUES ($1, $2, $3, $4, $5, $6, $7, true)
			RETURNING id`,
			c.disciplineID, c.name, c.desc, c.dayOfWeek, c.startTime, c.endTime, c.capacity,
		).Scan(&classID)
		if err != nil {
			log.Printf("Warning: Failed to insert class %s (day %d): %v", c.name, c.dayOfWeek, err)
			continue
		}
		if c.instructorID > 0 {
			_, _ = tx.Exec(`INSERT INTO class_instructors (class_id, instructor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
				classID, c.instructorID)
		}
	}

	// Generate schedules for next 21 days
	today := time.Now().Truncate(24 * time.Hour)
	for i := 0; i < 21; i++ {
		d := today.AddDate(0, 0, i)
		dow := int(d.Weekday()) // 0=Sunday matches day_of_week convention
		dateStr := d.Format("2006-01-02")

		_, err = tx.Exec(`
			INSERT INTO class_schedules (class_id, date, capacity, booked, cancelled)
			SELECT cl.id, $1::date, cl.capacity, 0, false
			FROM classes cl
			WHERE cl.day_of_week = $2
			  AND cl.active = true
			  AND NOT EXISTS (SELECT 1 FROM class_schedules cs WHERE cs.class_id = cl.id AND cs.date = $1::date)
			ON CONFLICT (class_id, date) DO NOTHING`,
			dateStr, dow)
		if err != nil {
			log.Printf("Warning: Failed to generate schedules for %s: %v", dateStr, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	log.Println("Default classes and schedules seeded successfully")
	return nil
}

func Seed(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		// Users exist, but ensure instructors, routines, and classes exist
		if err := SeedInstructors(db); err != nil {
			log.Printf("Warning: Failed to seed instructors: %v", err)
		}
		if err := SeedRoutines(db); err != nil {
			log.Printf("Warning: Failed to seed routines: %v", err)
		}
		if err := SeedClasses(db); err != nil {
			log.Printf("Warning: Failed to seed classes: %v", err)
		}
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

	// Create instructors
	_, err = tx.Exec(`
		INSERT INTO instructors (name, email, phone, specialty, bio, active) VALUES
		('Juan Pérez', 'juan@boxmagic.cl', '+56912345678', 'CrossFit', 'Instructor certificado CrossFit Level 1', true),
		('María González', 'maria@boxmagic.cl', '+56987654321', 'Halterofilia', 'Especialista en levantamiento olímpico', true),
		('Carlos Rodríguez', 'carlos@boxmagic.cl', '+56911223344', 'Gimnasia', 'Experto en gimnasia y calistenia', true)`)
	if err != nil {
		return err
	}

	// Get admin user ID for routines
	var adminID int64
	err = tx.QueryRow("SELECT id FROM users WHERE email = $1", "admin@boxmagic.cl").Scan(&adminID)
	if err != nil {
		return err
	}

	// Create routines (sin instructor por defecto, se pueden asignar después)
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

	// Seed classes after the initial transaction (needs discipline/instructor IDs)
	if err := SeedClasses(db); err != nil {
		log.Printf("Warning: Failed to seed classes: %v", err)
	}

	log.Println("Seed data created successfully")
	log.Println("  Admin: admin@boxmagic.cl / admin123")
	log.Println("  User:  user@boxmagic.cl / user123")
	return nil
}
