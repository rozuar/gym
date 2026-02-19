package models

import "time"

type OnrampProgram struct {
	ID               int64     `json:"id"`
	Name             string    `json:"name"`
	Description      string    `json:"description,omitempty"`
	RequiredSessions int       `json:"required_sessions"`
	Active           bool      `json:"active"`
	CreatedAt        time.Time `json:"created_at"`
	// Computed
	EnrolledCount int `json:"enrolled_count,omitempty"`
}

type OnrampEnrollment struct {
	ID                int64      `json:"id"`
	UserID            int64      `json:"user_id"`
	ProgramID         int64      `json:"program_id"`
	SessionsCompleted int        `json:"sessions_completed"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	// Joined
	UserName    string `json:"user_name,omitempty"`
	UserEmail   string `json:"user_email,omitempty"`
	ProgramName string `json:"program_name,omitempty"`
}

type CreateOnrampProgramRequest struct {
	Name             string `json:"name"`
	Description      string `json:"description,omitempty"`
	RequiredSessions int    `json:"required_sessions,omitempty"`
}

type UpdateSessionsRequest struct {
	Sessions int `json:"sessions"`
}
