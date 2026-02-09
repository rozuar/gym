package models

import (
	"time"
)

type Instructor struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Email       string    `json:"email,omitempty"`
	Phone       string    `json:"phone,omitempty"`
	Specialty   string    `json:"specialty,omitempty"` // CrossFit, Halterofilia, etc.
	Bio         string    `json:"bio,omitempty"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Requests

type CreateInstructorRequest struct {
	Name      string `json:"name"`
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
	Specialty string `json:"specialty,omitempty"`
	Bio       string `json:"bio,omitempty"`
}

type UpdateInstructorRequest struct {
	Name      string `json:"name,omitempty"`
	Email     string `json:"email,omitempty"`
	Phone     string `json:"phone,omitempty"`
	Specialty string `json:"specialty,omitempty"`
	Bio       string `json:"bio,omitempty"`
	Active    *bool  `json:"active,omitempty"`
}
