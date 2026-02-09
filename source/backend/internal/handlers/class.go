package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type ClassHandler struct {
	classRepo   *repository.ClassRepository
	paymentRepo *repository.PaymentRepository
}

func NewClassHandler(db *sql.DB) *ClassHandler {
	return &ClassHandler{
		classRepo:   repository.NewClassRepository(db),
		paymentRepo: repository.NewPaymentRepository(db),
	}
}

// Disciplines

func (h *ClassHandler) CreateDiscipline(w http.ResponseWriter, r *http.Request) {
	var req models.CreateDisciplineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}

	d := &models.Discipline{
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		Active:      true,
	}

	if err := h.classRepo.CreateDiscipline(d); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create discipline")
		return
	}

	respondJSON(w, http.StatusCreated, d)
}

func (h *ClassHandler) ListDisciplines(w http.ResponseWriter, r *http.Request) {
	disciplines, err := h.classRepo.ListDisciplines(true)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch disciplines")
		return
	}
	if disciplines == nil {
		disciplines = []*models.Discipline{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"disciplines": disciplines})
}

// Classes

func (h *ClassHandler) CreateClass(w http.ResponseWriter, r *http.Request) {
	var req models.CreateClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" || req.DisciplineID <= 0 || req.Capacity <= 0 {
		respondError(w, http.StatusBadRequest, "Name, discipline_id and capacity are required")
		return
	}

	// Validate: 1-2 instructors max
	if len(req.InstructorIDs) > 2 {
		respondError(w, http.StatusBadRequest, "Maximum 2 instructors per class")
		return
	}

	c := &models.Class{
		DisciplineID: req.DisciplineID,
		Name:         req.Name,
		Description:  req.Description,
		DayOfWeek:    req.DayOfWeek,
		StartTime:    req.StartTime,
		EndTime:      req.EndTime,
		Capacity:     req.Capacity,
		Active:       true,
	}

	if err := h.classRepo.CreateClass(c); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create class")
		return
	}

	// Assign instructors (1-2)
	if len(req.InstructorIDs) > 0 {
		instructorRepo := repository.NewInstructorRepository(h.classRepo.GetDB())
		if err := instructorRepo.AssignToClass(c.ID, req.InstructorIDs); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to assign instructors")
			return
		}
	}

	// Reload with instructors
	class, _ := h.classRepo.GetClassByID(c.ID)
	if class != nil {
		respondJSON(w, http.StatusCreated, class)
	} else {
		respondJSON(w, http.StatusCreated, c)
	}
}

func (h *ClassHandler) ListClasses(w http.ResponseWriter, r *http.Request) {
	var disciplineID int64
	if d := r.URL.Query().Get("discipline_id"); d != "" {
		disciplineID, _ = strconv.ParseInt(d, 10, 64)
	}

	classes, err := h.classRepo.ListClasses(disciplineID, true)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch classes")
		return
	}
	if classes == nil {
		classes = []*models.ClassWithDetails{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"classes": classes})
}

func (h *ClassHandler) GetClass(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	class, err := h.classRepo.GetClassByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Class not found")
		return
	}

	respondJSON(w, http.StatusOK, class)
}

func (h *ClassHandler) UpdateClass(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	var req models.UpdateClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	class, err := h.classRepo.GetClassByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Class not found")
		return
	}

	if req.Name != "" {
		class.Name = req.Name
	}
	if req.Description != "" {
		class.Description = req.Description
	}
	if req.StartTime != "" {
		class.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		class.EndTime = req.EndTime
	}
	if req.Capacity != nil {
		class.Capacity = *req.Capacity
	}
	if req.Active != nil {
		class.Active = *req.Active
	}

	if err := h.classRepo.UpdateClass(&class.Class); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update class")
		return
	}

	// Update instructors if provided
	if req.InstructorIDs != nil {
		// Validate: 1-2 instructors max
		if len(req.InstructorIDs) > 2 {
			respondError(w, http.StatusBadRequest, "Maximum 2 instructors per class")
			return
		}
		instructorRepo := repository.NewInstructorRepository(h.classRepo.GetDB())
		if err := instructorRepo.AssignToClass(id, req.InstructorIDs); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to update instructors")
			return
		}
	}

	// Reload with instructors
	updatedClass, _ := h.classRepo.GetClassByID(id)
	if updatedClass != nil {
		respondJSON(w, http.StatusOK, updatedClass)
	} else {
		respondJSON(w, http.StatusOK, class)
	}
}

func (h *ClassHandler) DeleteClass(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	if err := h.classRepo.DeleteClass(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete class")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Schedules

func (h *ClassHandler) ListSchedules(w http.ResponseWriter, r *http.Request) {
	from := time.Now().Truncate(24 * time.Hour)
	to := from.AddDate(0, 0, 14)

	if f := r.URL.Query().Get("from"); f != "" {
		if parsed, err := time.Parse("2006-01-02", f); err == nil {
			from = parsed
		}
	}
	if t := r.URL.Query().Get("to"); t != "" {
		if parsed, err := time.Parse("2006-01-02", t); err == nil {
			to = parsed
		}
	}

	schedules, err := h.classRepo.ListSchedules(from, to)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch schedules")
		return
	}
	if schedules == nil {
		schedules = []*models.ScheduleWithDetails{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"schedules": schedules,
		"from":      from.Format("2006-01-02"),
		"to":        to.Format("2006-01-02"),
	})
}

func (h *ClassHandler) GenerateSchedules(w http.ResponseWriter, r *http.Request) {
	startDate := time.Now().Truncate(24 * time.Hour)

	if s := r.URL.Query().Get("start"); s != "" {
		if parsed, err := time.Parse("2006-01-02", s); err == nil {
			startDate = parsed
		}
	}

	if err := h.classRepo.GenerateWeekSchedules(startDate); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate schedules")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Schedules generated"})
}

// Bookings

func (h *ClassHandler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	scheduleID, err := strconv.ParseInt(r.PathValue("scheduleId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid schedule ID")
		return
	}

	// Verify subscription
	subscription, err := h.paymentRepo.GetActiveSubscription(userID)
	if err != nil {
		respondError(w, http.StatusForbidden, "No active subscription")
		return
	}

	// Check class limit
	if subscription.ClassesAllowed > 0 && subscription.ClassesUsed >= subscription.ClassesAllowed {
		respondError(w, http.StatusForbidden, "Class limit reached")
		return
	}

	booking := &models.Booking{
		UserID:          userID,
		ClassScheduleID: scheduleID,
		SubscriptionID:  subscription.ID,
		Status:          "booked",
	}

	if err := h.classRepo.CreateBooking(booking); err != nil {
		respondError(w, http.StatusConflict, "Class is full or booking failed")
		return
	}

	// Increment classes used
	h.paymentRepo.IncrementClassesUsed(subscription.ID)

	respondJSON(w, http.StatusCreated, booking)
}

func (h *ClassHandler) CancelBooking(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	bookingID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid booking ID")
		return
	}

	if err := h.classRepo.CancelBooking(bookingID, userID); err != nil {
		respondError(w, http.StatusNotFound, "Booking not found or already cancelled")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Booking cancelled"})
}

func (h *ClassHandler) MyBookings(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	upcoming := r.URL.Query().Get("upcoming") == "true"

	bookings, err := h.classRepo.ListUserBookings(userID, upcoming)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch bookings")
		return
	}
	if bookings == nil {
		bookings = []*models.BookingWithDetails{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"bookings": bookings})
}

func (h *ClassHandler) CheckIn(w http.ResponseWriter, r *http.Request) {
	bookingID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid booking ID")
		return
	}

	if err := h.classRepo.CheckIn(bookingID); err != nil {
		respondError(w, http.StatusNotFound, "Booking not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Checked in"})
}

func (h *ClassHandler) GetScheduleAttendance(w http.ResponseWriter, r *http.Request) {
	scheduleID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid schedule ID")
		return
	}

	schedule, err := h.classRepo.GetScheduleByID(scheduleID)
	if err != nil {
		respondError(w, http.StatusNotFound, "Schedule not found")
		return
	}

	bookings, err := h.classRepo.GetScheduleBookings(scheduleID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch bookings")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"schedule": schedule,
		"bookings": bookings,
	})
}
