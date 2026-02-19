package models

import "time"

type Event struct {
	ID              int64     `json:"id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	EventType       string    `json:"event_type"`
	Date            time.Time `json:"date"`
	Capacity        int       `json:"capacity"`
	Price           int64     `json:"price"`
	Currency        string    `json:"currency"`
	ImageURL        string    `json:"image_url"`
	Active          bool      `json:"active"`
	CreatedBy       int64     `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	RegisteredCount int       `json:"registered_count"`
	IsRegistered    bool      `json:"is_registered"`
}

type EventRegistration struct {
	ID        int64     `json:"id"`
	EventID   int64     `json:"event_id"`
	UserID    int64     `json:"user_id"`
	Status    string    `json:"status"`
	Paid      bool      `json:"paid"`
	CreatedAt time.Time `json:"created_at"`
	UserName  string    `json:"user_name"`
	UserEmail string    `json:"user_email"`
}

type CreateEventRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	EventType   string `json:"event_type"`
	Date        string `json:"date"`
	Capacity    int    `json:"capacity"`
	Price       int64  `json:"price"`
	Currency    string `json:"currency"`
	ImageURL    string `json:"image_url"`
}
