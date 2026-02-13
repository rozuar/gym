package models

import "time"

type Authorization struct {
	ID           int64     `json:"id"`
	UserID       int64     `json:"user_id"`
	DocumentType string    `json:"document_type"`
	SignedAt     time.Time `json:"signed_at"`
	GuardianName string    `json:"guardian_name,omitempty"`
	GuardianRut  string    `json:"guardian_rut,omitempty"`
	Notes        string    `json:"notes,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}
