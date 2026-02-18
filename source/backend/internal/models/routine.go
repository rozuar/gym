package models

import (
	"time"
)

type Routine struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description,omitempty"`
	Type         string    `json:"type"` // wod, strength, skill, cardio
	Content      string    `json:"content"`
	Duration     int       `json:"duration,omitempty"`      // minutos
	Difficulty   string    `json:"difficulty,omitempty"`    // beginner, intermediate, advanced, rx
	InstructorID *int64    `json:"instructor_id,omitempty"` // Opcional
	CreatedBy    int64     `json:"created_by"`
	Active       bool      `json:"active"`
	Billable     bool      `json:"billable"`
	TargetUserID *int64    `json:"target_user_id,omitempty"`
	IsCustom     bool      `json:"is_custom"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ScheduleRoutine struct {
	ID              int64     `json:"id"`
	ClassScheduleID int64     `json:"class_schedule_id"`
	RoutineID       int64     `json:"routine_id"`
	Notes           string    `json:"notes,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

type UserRoutineResult struct {
	ID              int64     `json:"id"`
	UserID          int64     `json:"user_id"`
	RoutineID       int64     `json:"routine_id"`
	ClassScheduleID *int64    `json:"class_schedule_id,omitempty"`
	Score           string    `json:"score,omitempty"`
	Notes           string    `json:"notes,omitempty"`
	Rx              bool      `json:"rx"`
	IsPR            bool      `json:"is_pr"`
	CreatedAt       time.Time `json:"created_at"`
}

// Requests

type CreateRoutineRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description,omitempty"`
	Type         string `json:"type"`
	Content      string `json:"content"`
	Duration     int    `json:"duration,omitempty"`
	Difficulty   string `json:"difficulty,omitempty"`
	InstructorID *int64 `json:"instructor_id,omitempty"`
	Billable     bool   `json:"billable"`
	TargetUserID *int64 `json:"target_user_id,omitempty"`
	IsCustom     bool   `json:"is_custom"`
}

type UpdateRoutineRequest struct {
	Name         string `json:"name,omitempty"`
	Description  string `json:"description,omitempty"`
	Type         string `json:"type,omitempty"`
	Content      string `json:"content,omitempty"`
	Duration     *int   `json:"duration,omitempty"`
	Difficulty   string `json:"difficulty,omitempty"`
	InstructorID *int64 `json:"instructor_id,omitempty"`
	Active       *bool  `json:"active,omitempty"`
	Billable     *bool  `json:"billable,omitempty"`
	TargetUserID *int64 `json:"target_user_id,omitempty"`
	IsCustom     *bool  `json:"is_custom,omitempty"`
}

type AssignRoutineRequest struct {
	RoutineID int64  `json:"routine_id"`
	Notes     string `json:"notes,omitempty"`
}

type LogResultRequest struct {
	RoutineID       int64  `json:"routine_id"`
	ClassScheduleID *int64 `json:"class_schedule_id,omitempty"`
	Score           string `json:"score"`
	Notes           string `json:"notes,omitempty"`
	Rx              bool   `json:"rx"`
}

type UpdateResultRequest struct {
	Score string `json:"score,omitempty"`
	Notes string `json:"notes,omitempty"`
	Rx    *bool  `json:"rx,omitempty"`
}

// Views

type RoutineWithCreator struct {
	Routine
	CreatorName    string  `json:"creator_name"`
	InstructorName *string `json:"instructor_name,omitempty"`
	TargetUserName *string `json:"target_user_name,omitempty"`
}

type ScheduleRoutineWithDetails struct {
	ScheduleRoutine
	RoutineName    string `json:"routine_name"`
	RoutineType    string `json:"routine_type"`
	RoutineContent string `json:"routine_content"`
}

type UserResultWithDetails struct {
	UserRoutineResult
	RoutineName    string     `json:"routine_name"`
	RoutineType    string     `json:"routine_type"`
	ScheduleDate   *time.Time `json:"schedule_date,omitempty"`
	FistbumpCount  int        `json:"fistbump_count"`
	UserFistbumped bool       `json:"user_fistbumped"`
}

// Leaderboard

type LeaderboardEntry struct {
	UserID   int64  `json:"user_id"`
	UserName string `json:"user_name"`
	Score    string `json:"score"`
	Rx       bool   `json:"rx"`
	IsPR     bool   `json:"is_pr"`
}
