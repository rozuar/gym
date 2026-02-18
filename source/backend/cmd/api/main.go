package main

import (
	"log"
	"net/http"
	"os"

	"boxmagic/internal/config"
	"boxmagic/internal/handlers"
	"boxmagic/internal/middleware"
	"boxmagic/internal/repository"
	"boxmagic/internal/services"
)

func main() {
	cfg := config.Load()

	db, err := repository.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := repository.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	if err := repository.Seed(db); err != nil {
		log.Fatal("Failed to seed database:", err)
	}

	mux := http.NewServeMux()

	userRepo := repository.NewUserRepository(db)
	planRepo := repository.NewPlanRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)
	classRepo := repository.NewClassRepository(db)
	routineRepo := repository.NewRoutineRepository(db)
	instructorRepo := repository.NewInstructorRepository(db)
	feedRepo := repository.NewFeedRepository(db)
	statsRepo := repository.NewStatsRepository(db)

	authService := services.NewAuthService(userRepo, cfg)
	emailService := services.NewEmailService(cfg)

	// Ensure upload directory exists
	if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
		log.Fatal("Failed to create upload directory:", err)
	}

	configHandler := handlers.NewConfigHandler(cfg)
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userRepo)
	planHandler := handlers.NewPlanHandler(planRepo)
	paymentHandler := handlers.NewPaymentHandler(paymentRepo, planRepo, userRepo)
	classHandler := handlers.NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo, emailService)
	routineHandler := handlers.NewRoutineHandler(routineRepo, feedRepo)
	feedHandler := handlers.NewFeedHandler(feedRepo)
	instructorHandler := handlers.NewInstructorHandler(instructorRepo)
	statsHandler := handlers.NewStatsHandler(statsRepo)
	uploadHandler := handlers.NewUploadHandler(cfg)
	tvHandler := handlers.NewTVHandler(classRepo, routineRepo)

	// Public routes
	mux.HandleFunc("GET /api/v1/config", configHandler.Get)
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/v1/auth/refresh", authHandler.Refresh)

	// Dev only: seed test data (requires API_ENV=development)
	mux.HandleFunc("POST /api/v1/dev/seed-users", handlers.SeedTestUsers(db, cfg))
	mux.HandleFunc("POST /api/v1/dev/seed-all", handlers.SeedAllDevData(db, cfg))
	// Plans (public read, admin write)
	mux.HandleFunc("GET /api/v1/plans", planHandler.List)
	mux.HandleFunc("GET /api/v1/plans/{id}", planHandler.GetByID)
	mux.Handle("POST /api/v1/plans", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(planHandler.Create))))
	mux.Handle("PUT /api/v1/plans/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(planHandler.Update))))
	mux.Handle("DELETE /api/v1/plans/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(planHandler.Delete))))

	// Payments (solo admin registra)
	mux.Handle("POST /api/v1/payments", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(paymentHandler.Create))))
	mux.Handle("GET /api/v1/payments/me", middleware.Auth(cfg)(http.HandlerFunc(paymentHandler.MyPayments)))
	mux.Handle("GET /api/v1/subscriptions/me", middleware.Auth(cfg)(http.HandlerFunc(paymentHandler.MySubscription)))
	mux.Handle("GET /api/v1/payments", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(paymentHandler.ListAll))))

	// Instructors (admin only)
	mux.Handle("GET /api/v1/instructors", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(instructorHandler.List))))
	mux.Handle("GET /api/v1/instructors/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(instructorHandler.GetByID))))
	mux.Handle("POST /api/v1/instructors", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(instructorHandler.Create))))
	mux.Handle("PUT /api/v1/instructors/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(instructorHandler.Update))))
	mux.Handle("DELETE /api/v1/instructors/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(instructorHandler.Delete))))

	// Disciplines (public read, admin write)
	mux.HandleFunc("GET /api/v1/disciplines", classHandler.ListDisciplines)
	mux.Handle("POST /api/v1/disciplines", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.CreateDiscipline))))
	mux.Handle("PUT /api/v1/disciplines/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.UpdateDiscipline))))
	mux.Handle("DELETE /api/v1/disciplines/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.DeleteDiscipline))))

	// Classes (public read, admin write)
	mux.HandleFunc("GET /api/v1/classes", classHandler.ListClasses)
	mux.HandleFunc("GET /api/v1/classes/{id}", classHandler.GetClass)
	mux.Handle("POST /api/v1/classes", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.CreateClass))))
	mux.Handle("PUT /api/v1/classes/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.UpdateClass))))
	mux.Handle("DELETE /api/v1/classes/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.DeleteClass))))

	// Schedules
	mux.HandleFunc("GET /api/v1/schedules", classHandler.ListSchedules)
	mux.Handle("POST /api/v1/schedules/generate", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.GenerateSchedules))))
	mux.Handle("GET /api/v1/schedules/{id}/attendance", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.GetScheduleAttendance))))
	mux.Handle("POST /api/v1/schedules/{id}/cancel", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.CancelSchedule))))

	// Waitlist
	mux.Handle("POST /api/v1/schedules/{id}/waitlist", middleware.Auth(cfg)(http.HandlerFunc(classHandler.JoinWaitlist)))
	mux.Handle("DELETE /api/v1/schedules/{id}/waitlist", middleware.Auth(cfg)(http.HandlerFunc(classHandler.LeaveWaitlist)))
	mux.Handle("GET /api/v1/schedules/{id}/waitlist", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.GetWaitlist))))

	// Bookings
	mux.Handle("POST /api/v1/schedules/{scheduleId}/book", middleware.Auth(cfg)(http.HandlerFunc(classHandler.CreateBooking)))
	mux.Handle("GET /api/v1/bookings/me", middleware.Auth(cfg)(http.HandlerFunc(classHandler.MyBookings)))
	mux.Handle("DELETE /api/v1/bookings/{id}", middleware.Auth(cfg)(http.HandlerFunc(classHandler.CancelBooking)))
	mux.Handle("POST /api/v1/bookings/{id}/checkin", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(classHandler.CheckIn))))
	mux.Handle("POST /api/v1/bookings/{id}/before-photo", middleware.Auth(cfg)(http.HandlerFunc(classHandler.SetBookingBeforePhoto)))

	// Routines
	mux.Handle("GET /api/v1/routines/custom", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(routineHandler.ListCustom))))
	mux.Handle("GET /api/v1/routines", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.List)))
	mux.Handle("GET /api/v1/routines/{id}", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.GetByID)))
	mux.Handle("POST /api/v1/routines", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(routineHandler.Create))))
	mux.Handle("PUT /api/v1/routines/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(routineHandler.Update))))
	mux.Handle("DELETE /api/v1/routines/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(routineHandler.Delete))))
	mux.Handle("GET /api/v1/routines/{id}/history", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.GetRoutineHistory)))

	// Schedule Routines
	mux.Handle("GET /api/v1/schedules/{scheduleId}/routine", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.GetScheduleRoutine)))
	mux.Handle("POST /api/v1/schedules/{scheduleId}/routine", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(routineHandler.AssignToSchedule))))
	mux.Handle("DELETE /api/v1/schedules/{scheduleId}/routine", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(routineHandler.RemoveScheduleRoutine))))

	// Feed
	mux.Handle("GET /api/v1/feed", middleware.Auth(cfg)(http.HandlerFunc(feedHandler.GetFeed)))
	mux.Handle("POST /api/v1/fistbump", middleware.Auth(cfg)(http.HandlerFunc(feedHandler.CreateFistbump)))
	mux.Handle("DELETE /api/v1/fistbump", middleware.Auth(cfg)(http.HandlerFunc(feedHandler.DeleteFistbump)))

	// PRs
	mux.Handle("GET /api/v1/prs/me", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.MyPRs)))

	// Leaderboard
	mux.Handle("GET /api/v1/schedules/{id}/leaderboard", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.GetLeaderboard)))

	// Results
	mux.Handle("POST /api/v1/results", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.LogResult)))
	mux.Handle("GET /api/v1/results/me", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.MyResults)))
	mux.Handle("GET /api/v1/users/{userId}/results", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(routineHandler.UserResults))))
	mux.Handle("PUT /api/v1/results/{id}", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.UpdateResult)))
	mux.Handle("DELETE /api/v1/results/{id}", middleware.Auth(cfg)(http.HandlerFunc(routineHandler.DeleteResult)))

	// Users
	mux.Handle("GET /api/v1/users/me", middleware.Auth(cfg)(http.HandlerFunc(userHandler.GetMe)))
	mux.Handle("PUT /api/v1/users/me", middleware.Auth(cfg)(http.HandlerFunc(userHandler.UpdateMe)))
	mux.Handle("GET /api/v1/users", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(userHandler.List))))
	mux.Handle("GET /api/v1/users/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(userHandler.GetByID))))
	mux.Handle("PUT /api/v1/users/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(userHandler.Update))))
	mux.Handle("POST /api/v1/users/{id}/invitation", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(userHandler.AddInvitation))))
	mux.Handle("DELETE /api/v1/users/{id}", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(userHandler.Delete))))

	// Stats (admin only)
	mux.Handle("GET /api/v1/stats/dashboard", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.Dashboard))))
	mux.Handle("GET /api/v1/stats/attendance", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.Attendance))))
	mux.Handle("GET /api/v1/stats/revenue", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.Revenue))))
	mux.Handle("GET /api/v1/stats/plans", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.Plans))))
	mux.Handle("GET /api/v1/stats/users", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.Users))))
	mux.Handle("GET /api/v1/stats/classes", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.Classes))))
	mux.Handle("GET /api/v1/stats/report", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.MonthlyReport))))

	// Exports (admin only)
	mux.Handle("GET /api/v1/export/users", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.ExportUsers))))
	mux.Handle("GET /api/v1/export/revenue", middleware.Auth(cfg)(middleware.AdminOnly(http.HandlerFunc(statsHandler.ExportRevenue))))

	// Upload
	mux.Handle("POST /api/v1/upload", middleware.Auth(cfg)(http.HandlerFunc(uploadHandler.Upload)))

	// Static files (uploads)
	mux.Handle("GET /uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(cfg.UploadDir))))

	// TV Display (public)
	mux.HandleFunc("GET /api/v1/tv/today", tvHandler.GetToday)

	// Health check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	handler := middleware.CORS(middleware.Logger(mux))

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, handler); err != nil {
		log.Fatal("Server failed:", err)
	}
}
