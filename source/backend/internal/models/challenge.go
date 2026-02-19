package models

import "time"

type Challenge struct {
	ID               int64      `json:"id"`
	Name             string     `json:"name"`
	Description      string     `json:"description,omitempty"`
	Goal             string     `json:"goal,omitempty"`
	Type             string     `json:"type"` // attendance, score, custom
	StartDate        *time.Time `json:"start_date,omitempty"`
	EndDate          *time.Time `json:"end_date,omitempty"`
	Active           bool       `json:"active"`
	CreatedBy        int64      `json:"created_by"`
	CreatedAt        time.Time  `json:"created_at"`
	ParticipantCount int        `json:"participant_count,omitempty"`
}

type ChallengeParticipant struct {
	ID          int64      `json:"id"`
	ChallengeID int64      `json:"challenge_id"`
	UserID      int64      `json:"user_id"`
	Score       string     `json:"score,omitempty"`
	Notes       string     `json:"notes,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UserName    string     `json:"user_name,omitempty"`
}

type CreateChallengeRequest struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Goal        string `json:"goal,omitempty"`
	Type        string `json:"type,omitempty"`
	StartDate   string `json:"start_date,omitempty"`
	EndDate     string `json:"end_date,omitempty"`
}

type UpdateChallengeRequest struct {
	Name        string  `json:"name,omitempty"`
	Description string  `json:"description,omitempty"`
	Goal        string  `json:"goal,omitempty"`
	Type        string  `json:"type,omitempty"`
	StartDate   *string `json:"start_date,omitempty"`
	EndDate     *string `json:"end_date,omitempty"`
	Active      *bool   `json:"active,omitempty"`
}

type SubmitProgressRequest struct {
	Score string `json:"score,omitempty"`
	Notes string `json:"notes,omitempty"`
}
