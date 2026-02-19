package models

import (
	"time"
)

type Discipline struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Color       string    `json:"color,omitempty"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
}

type Class struct {
	ID           int64     `json:"id"`
	DisciplineID int64     `json:"discipline_id"`
	Name         string    `json:"name"`
	Description  string    `json:"description,omitempty"`
	DayOfWeek    int       `json:"day_of_week"` // 0=domingo, 1=lunes...
	StartTime    string    `json:"start_time"`  // HH:MM
	EndTime      string    `json:"end_time"`    // HH:MM
	Capacity     int       `json:"capacity"`
	Active       bool      `json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ClassSchedule struct {
	ID        int64     `json:"id"`
	ClassID   int64     `json:"class_id"`
	Date      time.Time `json:"date"`
	Capacity  int       `json:"capacity"`
	Booked    int       `json:"booked"`
	Cancelled bool      `json:"cancelled"`
	CreatedAt time.Time `json:"created_at"`
}

type Booking struct {
	ID              int64      `json:"id"`
	UserID          int64      `json:"user_id"`
	ClassScheduleID int64      `json:"class_schedule_id"`
	SubscriptionID  *int64     `json:"subscription_id,omitempty"` // null para reservas por invitación
	Status          string     `json:"status"`                    // booked, attended, cancelled, no_show
	CheckedInAt     *time.Time `json:"checked_in_at,omitempty"`
	BeforePhotoURL  string     `json:"before_photo_url,omitempty"` // Foto antes de clase (costo adicional)
	CreatedAt       time.Time  `json:"created_at"`
}

// Requests

type CreateDisciplineRequest struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Color       string `json:"color,omitempty"`
}

type CreateClassRequest struct {
	DisciplineID  int64   `json:"discipline_id"`
	Name          string  `json:"name"`
	Description   string  `json:"description,omitempty"`
	InstructorIDs []int64 `json:"instructor_ids,omitempty"` // 1-2 instructores
	DayOfWeek     int     `json:"day_of_week"`
	StartTime     string  `json:"start_time"`
	EndTime       string  `json:"end_time"`
	Capacity      int     `json:"capacity"`
}

type UpdateClassRequest struct {
	Name          string  `json:"name,omitempty"`
	Description   string  `json:"description,omitempty"`
	InstructorIDs []int64 `json:"instructor_ids,omitempty"` // 1-2 instructores
	StartTime     string  `json:"start_time,omitempty"`
	EndTime       string  `json:"end_time,omitempty"`
	Capacity      *int    `json:"capacity,omitempty"`
	Active        *bool   `json:"active,omitempty"`
}

// Views

type ClassWithDetails struct {
	Class
	DisciplineName string   `json:"discipline_name"`
	Instructors    []string `json:"instructors,omitempty"`    // Nombres de instructores
	InstructorIDs  []int64  `json:"instructor_ids,omitempty"` // IDs de instructores
}

type ScheduleWithDetails struct {
	ClassSchedule
	ClassName      string `json:"class_name"`
	DisciplineName string `json:"discipline_name"`
	StartTime      string `json:"start_time"`
	EndTime        string `json:"end_time"`
	Available      int    `json:"available"`
}

type BookingWithDetails struct {
	Booking
	ClassName      string    `json:"class_name"`
	DisciplineName string    `json:"discipline_name"`
	ScheduleDate   time.Time `json:"schedule_date"`
	StartTime      string    `json:"start_time"`
}

type BookingWithUser struct {
	Booking
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

// Waitlist

type WaitlistEntry struct {
	ID              int64      `json:"id"`
	UserID          int64      `json:"user_id"`
	ClassScheduleID int64      `json:"class_schedule_id"`
	Position        int        `json:"position"`
	PromotedAt      *time.Time `json:"promoted_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

type WaitlistEntryWithUser struct {
	WaitlistEntry
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

// TV Display

type TVSchedule struct {
	ScheduleWithDetails
	RoutineName            string              `json:"routine_name,omitempty"`
	RoutineType            string              `json:"routine_type,omitempty"`
	RoutineContent         string              `json:"routine_content,omitempty"`
	RoutineContentScaled   string              `json:"routine_content_scaled,omitempty"`
	RoutineContentBeginner string              `json:"routine_content_beginner,omitempty"`
	Leaderboard            []*LeaderboardEntry `json:"leaderboard,omitempty"`
}

type TVResponse struct {
	Date      string        `json:"date"`
	Schedules []*TVSchedule `json:"schedules"`
}
