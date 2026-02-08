package handlers

import (
	"database/sql"
	"net/http"
	"time"

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

// SeedAllDevData creates or resets all test data: users, disciplines, plans, classes, schedules, routines, and a subscription for the test user.
// Only available when API_ENV=development. Cleans existing dev data first so test users always have data.
func SeedAllDevData(db *sql.DB, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if cfg.Environment != devEnv {
			respondError(w, http.StatusForbidden, "Only available in development")
			return
		}

		userRepo := repository.NewUserRepository(db)
		classRepo := repository.NewClassRepository(db)
		planRepo := repository.NewPlanRepository(db)
		paymentRepo := repository.NewPaymentRepository(db)
		routineRepo := repository.NewRoutineRepository(db)

		// 0. Get test user IDs before deleting (for cleaning their data)
		var adminID, testUserID int64
		if a, _ := userRepo.GetByEmail("admin@boxmagic.cl"); a != nil {
			adminID = a.ID
		}
		if u, _ := userRepo.GetByEmail("user@boxmagic.cl"); u != nil {
			testUserID = u.ID
		}

		// 1. Clean in order (avoid FK violations)
		_, _ = db.Exec("DELETE FROM schedule_routines")
		_, _ = db.Exec("DELETE FROM user_routine_results")
		_, _ = db.Exec("DELETE FROM bookings")
		_, _ = db.Exec("DELETE FROM class_schedules")
		_, _ = db.Exec("DELETE FROM classes")
		_, _ = db.Exec("DELETE FROM routines")
		if testUserID != 0 {
			_, _ = db.Exec("DELETE FROM subscriptions WHERE user_id = $1", testUserID)
			_, _ = db.Exec("DELETE FROM payments WHERE user_id = $1", testUserID)
		}
		if adminID != 0 {
			_, _ = db.Exec("DELETE FROM refresh_tokens WHERE user_id = $1", adminID)
		}
		if testUserID != 0 {
			_, _ = db.Exec("DELETE FROM refresh_tokens WHERE user_id = $1", testUserID)
		}
		_ = userRepo.DeleteByEmail("admin@boxmagic.cl")
		_ = userRepo.DeleteByEmail("user@boxmagic.cl")

		// 2. Disciplines (always ensure we have them)
		var discCount int
		_ = db.QueryRow("SELECT COUNT(*) FROM disciplines").Scan(&discCount)
		if discCount == 0 {
			_, _ = db.Exec(`
				INSERT INTO disciplines (name, description, color, active) VALUES
				('CrossFit', 'Entrenamiento funcional de alta intensidad', '#FF6B35', true),
				('Halterofilia', 'Levantamiento olimpico de pesas', '#4ECDC4', true),
				('Gimnasia', 'Gimnasia deportiva y calistenia', '#45B7D1', true)`)
		}

		// 3. Plans (always ensure we have them)
		var planCount int
		_ = db.QueryRow("SELECT COUNT(*) FROM plans").Scan(&planCount)
		if planCount == 0 {
			_, _ = db.Exec(`
				INSERT INTO plans (name, description, price, duration, max_classes, active) VALUES
				('Plan Mensual', 'Acceso ilimitado por 30 dias', 45000, 30, 0, true),
				('Plan 12 Clases', '12 clases en 30 dias', 35000, 30, 12, true),
				('Plan 8 Clases', '8 clases en 30 dias', 28000, 30, 8, true)`)
		}

		// 4. Create test users
		adminHash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		userHash, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
		admin := &models.User{Email: "admin@boxmagic.cl", PasswordHash: string(adminHash), Name: "Administrador", Role: models.RoleAdmin, Active: true}
		if err := userRepo.Create(admin); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create admin user")
			return
		}
		user := &models.User{Email: "user@boxmagic.cl", PasswordHash: string(userHash), Name: "Usuario Demo", Role: models.RoleUser, Active: true}
		if err := userRepo.Create(user); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create test user")
			return
		}
		adminID = admin.ID
		userID := user.ID

		// 5. Classes (always create) — varias por disciplina
		discs, _ := classRepo.ListDisciplines(false)
		if len(discs) >= 3 {
			classesSpec := []struct {
				discIdx     int
				name, desc  string
				day         int
				start, end  string
				cap         int
			}{
				{0, "WOD Mañana", "CrossFit AM", 0, "09:00", "10:00", 12},
				{0, "WOD Tarde", "CrossFit PM", 1, "18:00", "19:00", 12},
				{0, "Open Box", "Libre CrossFit", 2, "07:00", "09:00", 15},
				{1, "Halterofilia", "Técnica", 2, "10:00", "11:00", 8},
				{1, "Fuerza", "Back Squat + Press", 4, "09:00", "10:30", 10},
				{2, "Gimnasia", "Skill + Muscle-up", 1, "17:00", "18:00", 10},
				{2, "Mobilidad", "Stretch y core", 3, "12:00", "12:45", 12},
			}
			for _, c := range classesSpec {
				if c.discIdx >= len(discs) {
					continue
				}
				cls := &models.Class{
					DisciplineID: discs[c.discIdx].ID,
					Name: c.name, Description: c.desc, InstructorID: &adminID,
					DayOfWeek: c.day, StartTime: c.start, EndTime: c.end, Capacity: c.cap,
				}
				_ = classRepo.CreateClass(cls)
			}
		} else if len(discs) > 0 {
			dID := discs[0].ID
			for _, c := range []struct{ name, desc string; day int; start, end string; cap int }{
				{"WOD Mañana", "CrossFit AM", 0, "09:00", "10:00", 12},
				{"WOD Tarde", "CrossFit PM", 1, "18:00", "19:00", 12},
				{"Halterofilia", "Técnica", 2, "10:00", "11:00", 8},
			} {
				cls := &models.Class{DisciplineID: dID, Name: c.name, Description: c.desc, InstructorID: &adminID, DayOfWeek: c.day, StartTime: c.start, EndTime: c.end, Capacity: c.cap}
				_ = classRepo.CreateClass(cls)
			}
		}

		// 6. Schedules for next 2 weeks
		weekStart := time.Now()
		for weekStart.Weekday() != time.Monday {
			weekStart = weekStart.AddDate(0, 0, -1)
		}
		_ = classRepo.GenerateWeekSchedules(weekStart)
		_ = classRepo.GenerateWeekSchedules(weekStart.AddDate(0, 0, 7))

		// 7. Routines / entrenamientos
		routines := []*models.Routine{
			{Name: "Fran", Description: "21-15-9", Type: "wod", Content: "Thruster 43kg, Pull-ups", Duration: 10, Difficulty: "rx", CreatedBy: adminID},
			{Name: "Cindy", Description: "AMRAP 20 min", Type: "wod", Content: "5 Pull-ups, 10 Push-ups, 15 Air Squats", Duration: 20, Difficulty: "intermediate", CreatedBy: adminID},
			{Name: "Helen", Description: "3 rondas", Type: "wod", Content: "400m run, 21 KB swing 24kg, 12 Pull-ups", Duration: 12, Difficulty: "intermediate", CreatedBy: adminID},
			{Name: "Grace", Description: "For time", Type: "wod", Content: "30 Clean & Jerk 43kg", Duration: 5, Difficulty: "rx", CreatedBy: adminID},
			{Name: "Murph", Description: "For time", Type: "wod", Content: "1 mile run, 100 Pull-ups, 200 Push-ups, 300 Air Squats, 1 mile run", Duration: 45, Difficulty: "rx", CreatedBy: adminID},
			{Name: "Fuerza A", Description: "Back Squat", Type: "strength", Content: "5x5 Back Squat @ 80%", Duration: 45, Difficulty: "intermediate", CreatedBy: adminID},
		}
		for _, r := range routines {
			_ = routineRepo.Create(r)
		}

		// 8. Subscription for test user
		var subID int64
		plans, _ := planRepo.List(true)
		if len(plans) > 0 {
			plan := plans[0]
			start := time.Now()
			end := start.AddDate(0, 0, plan.Duration)
			payment := &models.Payment{UserID: userID, PlanID: plan.ID, Amount: plan.Price, Currency: "CLP", Status: models.PaymentCompleted, PaymentMethod: "dev"}
			if err := paymentRepo.Create(payment); err == nil {
				sub := &models.Subscription{UserID: userID, PlanID: plan.ID, PaymentID: payment.ID, StartDate: start, EndDate: end, ClassesUsed: 0, ClassesAllowed: plan.MaxClasses, Active: true}
				if plan.MaxClasses == 0 {
					sub.ClassesAllowed = 999
				}
				if paymentRepo.CreateSubscription(sub) == nil {
					subID = sub.ID
				}
			}
		}

		// 9. Bookings de prueba para el usuario (reservas)
		if subID != 0 {
			from := weekStart
			to := weekStart.AddDate(0, 0, 14)
			schedules, _ := classRepo.ListSchedules(from, to)
			booked := 0
			for i := range schedules {
				if booked >= 4 {
					break
				}
				if schedules[i].Date.Before(time.Now()) {
					continue
				}
				b := &models.Booking{UserID: userID, ClassScheduleID: schedules[i].ID, SubscriptionID: subID}
				if classRepo.CreateBooking(b) == nil {
					booked++
				}
			}
		}

		// 10. Asignar rutinas a algunos horarios (entrenamiento del día)
		schedules, _ := classRepo.ListSchedules(weekStart, weekStart.AddDate(0, 0, 14))
		routineList, _ := routineRepo.List("", 10, 0)
		for i, s := range schedules {
			if i >= len(routineList) {
				break
			}
			_ = routineRepo.AssignToSchedule(&models.ScheduleRoutine{ClassScheduleID: s.ID, RoutineID: routineList[i%len(routineList)].ID, Notes: "WOD del día"})
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "Datos de prueba creados (usuarios, disciplinas, planes, clases, horarios, rutinas, suscripción)",
			"admin":   "admin@boxmagic.cl / admin123",
			"user":    "user@boxmagic.cl / user123",
		})
	}
}
