package models

import "time"

// Lead status values
const (
	LeadStatusNew        = "new"
	LeadStatusContacted  = "contacted"
	LeadStatusTrial      = "trial"
	LeadStatusConverted  = "converted"
	LeadStatusLost       = "lost"
)

// Lead source values
const (
	LeadSourceWeb       = "web"
	LeadSourceInstagram = "instagram"
	LeadSourceReferral  = "referral"
	LeadSourceWalkIn    = "walk_in"
	LeadSourceOther     = "other"
)

type Lead struct {
	ID           int64      `json:"id"`
	Name         string     `json:"name"`
	Email        string     `json:"email,omitempty"`
	Phone        string     `json:"phone,omitempty"`
	Source       string     `json:"source"`
	Status       string     `json:"status"`
	Notes        string     `json:"notes,omitempty"`
	AssignedTo   *int64     `json:"assigned_to,omitempty"`
	AssigneeName string     `json:"assignee_name,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CreateLeadRequest struct {
	Name       string `json:"name"`
	Email      string `json:"email,omitempty"`
	Phone      string `json:"phone,omitempty"`
	Source     string `json:"source,omitempty"`
	Notes      string `json:"notes,omitempty"`
	AssignedTo *int64 `json:"assigned_to,omitempty"`
}

type UpdateLeadRequest struct {
	Name       string  `json:"name,omitempty"`
	Email      string  `json:"email,omitempty"`
	Phone      string  `json:"phone,omitempty"`
	Source     string  `json:"source,omitempty"`
	Status     string  `json:"status,omitempty"`
	Notes      string  `json:"notes,omitempty"`
	AssignedTo *int64  `json:"assigned_to,omitempty"`
}
