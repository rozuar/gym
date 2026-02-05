package models

import (
	"time"
)

type Plan struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Price       int64     `json:"price"` // en centavos
	Currency    string    `json:"currency"`
	Duration    int       `json:"duration"` // días
	MaxClasses  int       `json:"max_classes,omitempty"` // 0 = ilimitado
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreatePlanRequest struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Price       int64  `json:"price"`
	Currency    string `json:"currency"`
	Duration    int    `json:"duration"`
	MaxClasses  int    `json:"max_classes,omitempty"`
}

type UpdatePlanRequest struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	Price       *int64 `json:"price,omitempty"`
	Duration    *int   `json:"duration,omitempty"`
	MaxClasses  *int   `json:"max_classes,omitempty"`
	Active      *bool  `json:"active,omitempty"`
}
