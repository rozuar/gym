package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"boxmagic/internal/models"
)

type ClassRepository struct {
	db *sql.DB
}

func NewClassRepository(db *sql.DB) *ClassRepository {
	return &ClassRepository{db: db}
}

func (r *ClassRepository) GetDB() *sql.DB {
	return r.db
}

// Disciplines

func (r *ClassRepository) CreateDiscipline(d *models.Discipline) error {
	query := `INSERT INTO disciplines (name, description, color, active)
			  VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	return r.db.QueryRow(query, d.Name, d.Description, d.Color, true).Scan(&d.ID, &d.CreatedAt)
}

func (r *ClassRepository) UpdateDiscipline(d *models.Discipline) error {
	query := `UPDATE disciplines SET name=$1, description=$2, color=$3, active=$4 WHERE id=$5`
	_, err := r.db.Exec(query, d.Name, d.Description, d.Color, d.Active, d.ID)
	return err
}

func (r *ClassRepository) DeleteDiscipline(id int64) error {
	_, err := r.db.Exec("DELETE FROM disciplines WHERE id = $1", id)
	return err
}

func (r *ClassRepository) ListDisciplines(activeOnly bool) ([]*models.Discipline, error) {
	query := `SELECT id, name, description, color, active, created_at FROM disciplines`
	if activeOnly {
		query += " WHERE active = true"
	}
	query += " ORDER BY name"

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var disciplines []*models.Discipline
	for rows.Next() {
		d := &models.Discipline{}
		if err := rows.Scan(&d.ID, &d.Name, &d.Description, &d.Color, &d.Active, &d.CreatedAt); err != nil {
			return nil, err
		}
		disciplines = append(disciplines, d)
	}
	return disciplines, nil
}

// Classes

func (r *ClassRepository) CreateClass(c *models.Class) error {
	query := `INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, c.DisciplineID, c.Name, c.Description,
		c.DayOfWeek, c.StartTime, c.EndTime, c.Capacity).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *ClassRepository) GetClassByID(id int64) (*models.ClassWithDetails, error) {
	c := &models.ClassWithDetails{}
	query := `SELECT c.id, c.discipline_id, c.name, c.description, c.day_of_week,
			         c.start_time, c.end_time, c.capacity, c.active, c.created_at, c.updated_at,
			         d.name
			  FROM classes c
			  JOIN disciplines d ON c.discipline_id = d.id
			  WHERE c.id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&c.ID, &c.DisciplineID, &c.Name, &c.Description, &c.DayOfWeek,
		&c.StartTime, &c.EndTime, &c.Capacity, &c.Active, &c.CreatedAt, &c.UpdatedAt,
		&c.DisciplineName,
	)
	if err != nil {
		return nil, err
	}

	// Load instructors
	instructorRepo := NewInstructorRepository(r.db)
	instructors, _ := instructorRepo.GetClassInstructors(id)
	c.Instructors = make([]string, len(instructors))
	c.InstructorIDs = make([]int64, len(instructors))
	for i, inst := range instructors {
		c.Instructors[i] = inst.Name
		c.InstructorIDs[i] = inst.ID
	}

	return c, nil
}

func (r *ClassRepository) ListClasses(disciplineID int64, activeOnly bool) ([]*models.ClassWithDetails, error) {
	query := `SELECT c.id, c.discipline_id, c.name, c.description, c.day_of_week,
			         c.start_time, c.end_time, c.capacity, c.active, c.created_at, c.updated_at,
			         d.name
			  FROM classes c
			  JOIN disciplines d ON c.discipline_id = d.id
			  WHERE 1=1`

	args := []interface{}{}
	argCount := 0

	if disciplineID > 0 {
		argCount++
		query += fmt.Sprintf(" AND c.discipline_id = $%d", argCount)
		args = append(args, disciplineID)
	}
	if activeOnly {
		query += " AND c.active = true"
	}
	query += " ORDER BY c.day_of_week, c.start_time"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []*models.ClassWithDetails
	instructorRepo := NewInstructorRepository(r.db)
	for rows.Next() {
		c := &models.ClassWithDetails{}
		if err := rows.Scan(
			&c.ID, &c.DisciplineID, &c.Name, &c.Description, &c.DayOfWeek,
			&c.StartTime, &c.EndTime, &c.Capacity, &c.Active, &c.CreatedAt, &c.UpdatedAt,
			&c.DisciplineName,
		); err != nil {
			return nil, err
		}
		// Load instructors for each class
		instructors, _ := instructorRepo.GetClassInstructors(c.ID)
		c.Instructors = make([]string, len(instructors))
		c.InstructorIDs = make([]int64, len(instructors))
		for i, inst := range instructors {
			c.Instructors[i] = inst.Name
			c.InstructorIDs[i] = inst.ID
		}
		classes = append(classes, c)
	}
	return classes, nil
}

func (r *ClassRepository) UpdateClass(c *models.Class) error {
	query := `UPDATE classes SET name=$1, description=$2, start_time=$3, end_time=$4, capacity=$5, active=$6, updated_at=$7 WHERE id=$8`
	c.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, c.Name, c.Description, c.StartTime, c.EndTime, c.Capacity, c.Active, c.UpdatedAt, c.ID)
	return err
}

func (r *ClassRepository) DeleteClass(id int64) error {
	_, err := r.db.Exec("DELETE FROM classes WHERE id = $1", id)
	return err
}

// Schedules

func (r *ClassRepository) CreateSchedule(s *models.ClassSchedule) error {
	query := `INSERT INTO class_schedules (class_id, date, capacity, booked, cancelled)
			  VALUES ($1, $2, $3, 0, false) RETURNING id, created_at`
	return r.db.QueryRow(query, s.ClassID, s.Date, s.Capacity).Scan(&s.ID, &s.CreatedAt)
}

func (r *ClassRepository) GetScheduleByID(id int64) (*models.ScheduleWithDetails, error) {
	s := &models.ScheduleWithDetails{}
	query := `SELECT cs.id, cs.class_id, cs.date, cs.capacity, cs.booked, cs.cancelled, cs.created_at,
			         c.name, d.name, c.start_time, c.end_time
			  FROM class_schedules cs
			  JOIN classes c ON cs.class_id = c.id
			  JOIN disciplines d ON c.discipline_id = d.id
			  WHERE cs.id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&s.ID, &s.ClassID, &s.Date, &s.Capacity, &s.Booked, &s.Cancelled, &s.CreatedAt,
		&s.ClassName, &s.DisciplineName, &s.StartTime, &s.EndTime,
	)
	if err != nil {
		return nil, err
	}
	s.Available = s.Capacity - s.Booked
	return s, nil
}

func (r *ClassRepository) ListSchedules(from, to time.Time) ([]*models.ScheduleWithDetails, error) {
	query := `SELECT cs.id, cs.class_id, cs.date, cs.capacity, cs.booked, cs.cancelled, cs.created_at,
			         c.name, d.name, c.start_time, c.end_time
			  FROM class_schedules cs
			  JOIN classes c ON cs.class_id = c.id
			  JOIN disciplines d ON c.discipline_id = d.id
			  WHERE cs.date >= $1 AND cs.date <= $2
			  ORDER BY cs.date, c.start_time`

	rows, err := r.db.Query(query, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []*models.ScheduleWithDetails
	for rows.Next() {
		s := &models.ScheduleWithDetails{}
		if err := rows.Scan(
			&s.ID, &s.ClassID, &s.Date, &s.Capacity, &s.Booked, &s.Cancelled, &s.CreatedAt,
			&s.ClassName, &s.DisciplineName, &s.StartTime, &s.EndTime,
		); err != nil {
			return nil, err
		}
		s.Available = s.Capacity - s.Booked
		schedules = append(schedules, s)
	}
	return schedules, nil
}

func (r *ClassRepository) GenerateWeekSchedules(startDate time.Time) error {
	query := `INSERT INTO class_schedules (class_id, date, capacity)
			  SELECT c.id, $1::date, c.capacity
			  FROM classes c
			  WHERE c.active = true
			  AND c.day_of_week = $2
			  AND NOT EXISTS (
				  SELECT 1 FROM class_schedules cs
				  WHERE cs.class_id = c.id AND cs.date = $1::date
			  )`

	for i := 0; i < 7; i++ {
		date := startDate.AddDate(0, 0, i)
		dayOfWeek := int(date.Weekday()) // Sunday=0, Monday=1, ... matches DB convention
		_, err := r.db.Exec(query, date, dayOfWeek)
		if err != nil {
			return err
		}
	}
	return nil
}

// Bookings

// BookingCreditAction specifies what credit to consume within the booking transaction.
type BookingCreditAction struct {
	UseInvitation  bool  // decrement invitation_classes on user
	SubscriptionID int64 // increment classes_used on subscription (0 = skip)
}

func (r *ClassRepository) CreateBooking(b *models.Booking) error {
	return r.CreateBookingTx(b, nil)
}

func (r *ClassRepository) CreateBookingTx(b *models.Booking, credit *BookingCreditAction) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check capacity and not cancelled
	var booked, capacity int
	var cancelled bool
	err = tx.QueryRow("SELECT booked, capacity, cancelled FROM class_schedules WHERE id = $1 FOR UPDATE", b.ClassScheduleID).Scan(&booked, &capacity, &cancelled)
	if err != nil {
		return err
	}
	if cancelled {
		return errors.New("schedule is cancelled")
	}
	if booked >= capacity {
		return sql.ErrNoRows // No space
	}

	// Decrement credits atomically within the same transaction
	if credit != nil {
		if credit.UseInvitation {
			res, err := tx.Exec("UPDATE users SET invitation_classes = invitation_classes - 1 WHERE id = $1 AND invitation_classes > 0", b.UserID)
			if err != nil {
				return err
			}
			n, _ := res.RowsAffected()
			if n == 0 {
				return errors.New("no invitation classes available")
			}
		}
		if credit.SubscriptionID > 0 {
			_, err := tx.Exec("UPDATE subscriptions SET classes_used = classes_used + 1 WHERE id = $1", credit.SubscriptionID)
			if err != nil {
				return err
			}
		}
	}

	// Create booking (subscription_id puede ser NULL para invitaciones)
	subID := sql.NullInt64{Valid: false}
	if b.SubscriptionID != nil {
		subID = sql.NullInt64{Int64: *b.SubscriptionID, Valid: true}
	}
	query := `INSERT INTO bookings (user_id, class_schedule_id, subscription_id, status)
			  VALUES ($1, $2, $3, 'booked') RETURNING id, created_at`
	err = tx.QueryRow(query, b.UserID, b.ClassScheduleID, subID).Scan(&b.ID, &b.CreatedAt)
	if err != nil {
		return err
	}

	// Update schedule
	_, err = tx.Exec("UPDATE class_schedules SET booked = booked + 1 WHERE id = $1", b.ClassScheduleID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *ClassRepository) CancelBooking(bookingID, userID int64) (*int64, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var scheduleID int64
	var subID sql.NullInt64
	err = tx.QueryRow("UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status = 'booked' RETURNING class_schedule_id, subscription_id", bookingID, userID).Scan(&scheduleID, &subID)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec("UPDATE class_schedules SET booked = booked - 1 WHERE id = $1", scheduleID)
	if err != nil {
		return nil, err
	}

	// Restore credits atomically within the same transaction
	if subID.Valid {
		_, err = tx.Exec("UPDATE subscriptions SET classes_used = GREATEST(classes_used - 1, 0) WHERE id = $1", subID.Int64)
		if err != nil {
			return nil, err
		}
	} else {
		// Booking was via invitation — restore the invitation class
		_, err = tx.Exec("UPDATE users SET invitation_classes = invitation_classes + 1 WHERE id = $1", userID)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	if subID.Valid {
		return &subID.Int64, nil
	}
	return nil, nil
}

func (r *ClassRepository) CheckIn(bookingID int64) error {
	now := time.Now()
	_, err := r.db.Exec("UPDATE bookings SET status = 'attended', checked_in_at = $1 WHERE id = $2 AND status = 'booked'", now, bookingID)
	return err
}

func (r *ClassRepository) SetBookingBeforePhoto(bookingID, userID int64, photoURL string) error {
	res, err := r.db.Exec(
		`UPDATE bookings SET before_photo_url = $1 WHERE id = $2 AND user_id = $3 AND status = 'booked'`,
		photoURL, bookingID, userID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *ClassRepository) ListUserBookings(userID int64, upcoming bool) ([]*models.BookingWithDetails, error) {
	query := `SELECT b.id, b.user_id, b.class_schedule_id, b.subscription_id, b.status, b.checked_in_at, COALESCE(b.before_photo_url,''), b.created_at,
			         c.name, d.name, cs.date, c.start_time
			  FROM bookings b
			  JOIN class_schedules cs ON b.class_schedule_id = cs.id
			  JOIN classes c ON cs.class_id = c.id
			  JOIN disciplines d ON c.discipline_id = d.id
			  WHERE b.user_id = $1`

	if upcoming {
		query += " AND cs.date >= CURRENT_DATE AND b.status = 'booked'"
	}
	query += " ORDER BY cs.date DESC, c.start_time DESC LIMIT 50"

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*models.BookingWithDetails
	for rows.Next() {
		b := &models.BookingWithDetails{}
		var subID sql.NullInt64
		if err := rows.Scan(
			&b.ID, &b.UserID, &b.ClassScheduleID, &subID, &b.Status, &b.CheckedInAt, &b.BeforePhotoURL, &b.CreatedAt,
			&b.ClassName, &b.DisciplineName, &b.ScheduleDate, &b.StartTime,
		); err != nil {
			return nil, err
		}
		if subID.Valid {
			b.SubscriptionID = &subID.Int64
		}
		bookings = append(bookings, b)
	}
	return bookings, nil
}

func (r *ClassRepository) CancelSchedule(scheduleID int64) ([]*models.BookingWithUser, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Mark schedule as cancelled
	res, err := tx.Exec("UPDATE class_schedules SET cancelled = true WHERE id = $1 AND cancelled = false", scheduleID)
	if err != nil {
		return nil, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return nil, errors.New("schedule not found or already cancelled")
	}

	// Get all active bookings
	rows, err := tx.Query(`SELECT b.id, b.user_id, b.class_schedule_id, b.subscription_id, b.status, b.checked_in_at, COALESCE(b.before_photo_url,''), b.created_at,
		u.name, u.email
		FROM bookings b JOIN users u ON b.user_id = u.id
		WHERE b.class_schedule_id = $1 AND b.status = 'booked'`, scheduleID)
	if err != nil {
		return nil, err
	}

	var bookings []*models.BookingWithUser
	for rows.Next() {
		b := &models.BookingWithUser{}
		var subID sql.NullInt64
		if err := rows.Scan(&b.ID, &b.UserID, &b.ClassScheduleID, &subID, &b.Status, &b.CheckedInAt, &b.BeforePhotoURL, &b.CreatedAt, &b.UserName, &b.UserEmail); err != nil {
			rows.Close()
			return nil, err
		}
		if subID.Valid {
			b.SubscriptionID = &subID.Int64
		}
		bookings = append(bookings, b)
	}
	rows.Close()

	// Cancel each booking and restore credits
	for _, b := range bookings {
		_, err := tx.Exec("UPDATE bookings SET status = 'cancelled' WHERE id = $1", b.ID)
		if err != nil {
			return nil, err
		}
		if b.SubscriptionID != nil {
			_, err = tx.Exec("UPDATE subscriptions SET classes_used = GREATEST(classes_used - 1, 0) WHERE id = $1", *b.SubscriptionID)
		} else {
			_, err = tx.Exec("UPDATE users SET invitation_classes = invitation_classes + 1 WHERE id = $1", b.UserID)
		}
		if err != nil {
			return nil, err
		}
	}

	// Reset booked count
	_, err = tx.Exec("UPDATE class_schedules SET booked = 0 WHERE id = $1", scheduleID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return bookings, nil
}

func (r *ClassRepository) GetScheduleBookings(scheduleID int64) ([]*models.BookingWithUser, error) {
	query := `SELECT b.id, b.user_id, b.class_schedule_id, b.subscription_id, b.status, b.checked_in_at, COALESCE(b.before_photo_url,''), b.created_at,
			         u.name, u.email
			  FROM bookings b
			  JOIN users u ON b.user_id = u.id
			  WHERE b.class_schedule_id = $1 ORDER BY b.created_at`

	rows, err := r.db.Query(query, scheduleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []*models.BookingWithUser
	for rows.Next() {
		b := &models.BookingWithUser{}
		var subID sql.NullInt64
		if err := rows.Scan(&b.ID, &b.UserID, &b.ClassScheduleID, &subID, &b.Status, &b.CheckedInAt, &b.BeforePhotoURL, &b.CreatedAt, &b.UserName, &b.UserEmail); err != nil {
			return nil, err
		}
		if subID.Valid {
			b.SubscriptionID = &subID.Int64
		}
		bookings = append(bookings, b)
	}
	return bookings, nil
}
