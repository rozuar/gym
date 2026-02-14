package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type mockClassRepo struct {
	createDisciplineErr  error
	listDisciplines      []*models.Discipline
	listDisciplinesErr   error
	createClassErr       error
	assignInstructorsErr error
	createBookingErr     error
	cancelBookingErr     error
	listUserBookings     []*models.BookingWithDetails
	listUserBookingsErr  error
	listSchedules        []*models.ScheduleWithDetails
	listSchedulesErr     error
	generateSchedulesErr error
}

func (m *mockClassRepo) GetDB() *sql.DB                              { return nil }
func (m *mockClassRepo) CreateDiscipline(d *models.Discipline) error { return m.createDisciplineErr }
func (m *mockClassRepo) UpdateDiscipline(d *models.Discipline) error { return nil }
func (m *mockClassRepo) DeleteDiscipline(id int64) error             { return nil }
func (m *mockClassRepo) ListDisciplines(activeOnly bool) ([]*models.Discipline, error) {
	return m.listDisciplines, m.listDisciplinesErr
}
func (m *mockClassRepo) CreateClass(c *models.Class) error                       { return m.createClassErr }
func (m *mockClassRepo) GetClassByID(id int64) (*models.ClassWithDetails, error) { return nil, nil }
func (m *mockClassRepo) ListClasses(disciplineID int64, activeOnly bool) ([]*models.ClassWithDetails, error) {
	return nil, nil
}
func (m *mockClassRepo) UpdateClass(c *models.Class) error            { return nil }
func (m *mockClassRepo) DeleteClass(id int64) error                   { return nil }
func (m *mockClassRepo) CreateSchedule(s *models.ClassSchedule) error { return nil }
func (m *mockClassRepo) GetScheduleByID(id int64) (*models.ScheduleWithDetails, error) {
	return nil, nil
}
func (m *mockClassRepo) ListSchedules(from, to time.Time) ([]*models.ScheduleWithDetails, error) {
	return m.listSchedules, m.listSchedulesErr
}
func (m *mockClassRepo) GenerateWeekSchedules(startDate time.Time) error {
	return m.generateSchedulesErr
}
func (m *mockClassRepo) CreateBooking(b *models.Booking) error { return m.createBookingErr }
func (m *mockClassRepo) CreateBookingTx(b *models.Booking, credit *repository.BookingCreditAction) error {
	return m.createBookingErr
}
func (m *mockClassRepo) CancelBooking(bookingID, userID int64) (*int64, error) {
	return nil, m.cancelBookingErr
}
func (m *mockClassRepo) CheckIn(bookingID int64) error               { return nil }
func (m *mockClassRepo) SetBookingBeforePhoto(bookingID, userID int64, photoURL string) error {
	return nil
}
func (m *mockClassRepo) ListUserBookings(userID int64, upcoming bool) ([]*models.BookingWithDetails, error) {
	return m.listUserBookings, m.listUserBookingsErr
}
func (m *mockClassRepo) GetScheduleBookings(scheduleID int64) ([]*models.BookingWithUser, error) {
	return nil, nil
}

type mockInstructorRepo struct {
	assignToClassErr error
}

func (m *mockInstructorRepo) Create(instructor *models.Instructor) error         { return nil }
func (m *mockInstructorRepo) GetByID(id int64) (*models.Instructor, error)       { return nil, nil }
func (m *mockInstructorRepo) List(activeOnly bool) ([]*models.Instructor, error) { return nil, nil }
func (m *mockInstructorRepo) Update(instructor *models.Instructor) error         { return nil }
func (m *mockInstructorRepo) Delete(id int64) error                              { return nil }
func (m *mockInstructorRepo) AssignToClass(classID int64, instructorIDs []int64) error {
	return m.assignToClassErr
}
func (m *mockInstructorRepo) GetClassInstructors(classID int64) ([]*models.Instructor, error) {
	return nil, nil
}

type mockUserRepo struct {
	user *models.User
	err  error
}

func (m *mockUserRepo) Create(user *models.User) error                 { return nil }
func (m *mockUserRepo) GetByEmail(email string) (*models.User, error)  { return m.user, m.err }
func (m *mockUserRepo) GetByID(id int64) (*models.User, error)         { return m.user, m.err }
func (m *mockUserRepo) Update(user *models.User) error                 { return nil }
func (m *mockUserRepo) Delete(id int64) error                          { return nil }
func (m *mockUserRepo) List(limit, offset int) ([]*models.User, error) { return nil, nil }
func (m *mockUserRepo) SaveRefreshToken(userID int64, token string, expiresAt time.Time) error {
	return nil
}
func (m *mockUserRepo) GetRefreshToken(token string) (int64, error)        { return 0, nil }
func (m *mockUserRepo) DeleteRefreshToken(token string) error              { return nil }
func (m *mockUserRepo) AddInvitationClasses(userID int64, count int) error { return nil }
func (m *mockUserRepo) UseInvitationClass(userID int64) (bool, error)      { return true, nil }

func classRequestWithAuth(r *http.Request, userID int64) *http.Request {
	ctx := middleware.WithAuth(r.Context(), userID, models.RoleUser)
	return r.WithContext(ctx)
}

func adminRequestWithAuth(r *http.Request) *http.Request {
	ctx := middleware.WithAuth(r.Context(), 1, models.RoleAdmin)
	return r.WithContext(ctx)
}

func TestClassHandler_CreateDiscipline_InvalidBody(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	req := httptest.NewRequest("POST", "/api/v1/disciplines", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	req = adminRequestWithAuth(req)
	rr := httptest.NewRecorder()

	handler.CreateDiscipline(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestClassHandler_CreateDiscipline_NameRequired(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	body := `{"description":"test"}`
	req := httptest.NewRequest("POST", "/api/v1/disciplines", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = adminRequestWithAuth(req)
	rr := httptest.NewRecorder()

	handler.CreateDiscipline(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestClassHandler_CreateDiscipline_Success(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	body := `{"name":"CrossFit","description":"CF","color":"#FF0000"}`
	req := httptest.NewRequest("POST", "/api/v1/disciplines", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = adminRequestWithAuth(req)
	rr := httptest.NewRecorder()

	handler.CreateDiscipline(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}
}

func TestClassHandler_ListDisciplines_Success(t *testing.T) {
	classRepo := &mockClassRepo{listDisciplines: []*models.Discipline{{ID: 1, Name: "CF"}}}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	req := httptest.NewRequest("GET", "/api/v1/disciplines", nil)
	rr := httptest.NewRecorder()

	handler.ListDisciplines(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestClassHandler_CreateClass_InvalidBody(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	req := httptest.NewRequest("POST", "/api/v1/classes", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	req = adminRequestWithAuth(req)
	rr := httptest.NewRecorder()

	handler.CreateClass(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestClassHandler_CreateClass_MissingFields(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	body := `{"discipline_id":1}`
	req := httptest.NewRequest("POST", "/api/v1/classes", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = adminRequestWithAuth(req)
	rr := httptest.NewRecorder()

	handler.CreateClass(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestClassHandler_CreateClass_TooManyInstructors(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	body := `{"discipline_id":1,"name":"WOD","capacity":12,"instructor_ids":[1,2,3]}`
	req := httptest.NewRequest("POST", "/api/v1/classes", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = adminRequestWithAuth(req)
	rr := httptest.NewRecorder()

	handler.CreateClass(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestClassHandler_CreateClass_Success(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	body := `{"discipline_id":1,"name":"WOD Mañana","capacity":12,"day_of_week":1,"start_time":"09:00","end_time":"10:00"}`
	req := httptest.NewRequest("POST", "/api/v1/classes", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = adminRequestWithAuth(req)
	rr := httptest.NewRecorder()

	handler.CreateClass(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}
}

func TestClassHandler_CreateBooking_NoSubscription(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{getActiveSubscriptionErr: errors.New("none")}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/schedules/{scheduleId}/book", http.HandlerFunc(handler.CreateBooking))

	req := httptest.NewRequest("POST", "/api/v1/schedules/1/book", nil)
	req = classRequestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestClassHandler_CreateBooking_ClassLimitReached(t *testing.T) {
	sub := &models.SubscriptionWithPlan{
		Subscription: models.Subscription{ID: 1, UserID: 1, PlanID: 1, Active: true, ClassesUsed: 8, ClassesAllowed: 8},
		PlanName:     "8 Clases",
		PlanPrice:    28000,
	}
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{getActiveSubscription: sub}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/schedules/{scheduleId}/book", http.HandlerFunc(handler.CreateBooking))

	req := httptest.NewRequest("POST", "/api/v1/schedules/1/book", nil)
	req = classRequestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestClassHandler_CreateBooking_Success(t *testing.T) {
	sub := &models.SubscriptionWithPlan{
		Subscription: models.Subscription{ID: 1, UserID: 1, PlanID: 1, Active: true, ClassesUsed: 0, ClassesAllowed: 0},
		PlanName:     "Mensual",
		PlanPrice:    45000,
	}
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{getActiveSubscription: sub}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/schedules/{scheduleId}/book", http.HandlerFunc(handler.CreateBooking))

	req := httptest.NewRequest("POST", "/api/v1/schedules/1/book", nil)
	req = classRequestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	var result map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&result); err != nil {
		t.Fatal(err)
	}
}

func TestClassHandler_CancelBooking_InvalidID(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	mux := http.NewServeMux()
	mux.Handle("DELETE /api/v1/bookings/{id}", http.HandlerFunc(handler.CancelBooking))

	req := httptest.NewRequest("DELETE", "/api/v1/bookings/abc", nil)
	req = classRequestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestClassHandler_CancelBooking_NotFound(t *testing.T) {
	classRepo := &mockClassRepo{cancelBookingErr: errors.New("not found")}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	mux := http.NewServeMux()
	mux.Handle("DELETE /api/v1/bookings/{id}", http.HandlerFunc(handler.CancelBooking))

	req := httptest.NewRequest("DELETE", "/api/v1/bookings/999", nil)
	req = classRequestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}

func TestClassHandler_CancelBooking_Success(t *testing.T) {
	classRepo := &mockClassRepo{}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	mux := http.NewServeMux()
	mux.Handle("DELETE /api/v1/bookings/{id}", http.HandlerFunc(handler.CancelBooking))

	req := httptest.NewRequest("DELETE", "/api/v1/bookings/1", nil)
	req = classRequestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestClassHandler_MyBookings_Success(t *testing.T) {
	classRepo := &mockClassRepo{listUserBookings: []*models.BookingWithDetails{}}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	req := httptest.NewRequest("GET", "/api/v1/bookings/me", nil)
	req = classRequestWithAuth(req, 1)
	rr := httptest.NewRecorder()

	handler.MyBookings(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestClassHandler_ListSchedules_Success(t *testing.T) {
	classRepo := &mockClassRepo{listSchedules: []*models.ScheduleWithDetails{}}
	paymentRepo := &mockPaymentRepo{}
	instructorRepo := &mockInstructorRepo{}
	userRepo := &mockUserRepo{}
	handler := NewClassHandler(classRepo, paymentRepo, instructorRepo, userRepo)

	req := httptest.NewRequest("GET", "/api/v1/schedules", nil)
	rr := httptest.NewRecorder()

	handler.ListSchedules(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
