package models

import "time"

type Movement struct {
	ID               int64     `json:"id"`
	Name             string    `json:"name"`
	Description      string    `json:"description"`
	Category         string    `json:"category"`
	VideoURL         string    `json:"video_url"`
	MusclesPrimary   string    `json:"muscles_primary"`
	MusclesSecondary string    `json:"muscles_secondary"`
	Active           bool      `json:"active"`
	CreatedAt        time.Time `json:"created_at"`
}

type CreateMovementRequest struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	Category         string `json:"category"`
	VideoURL         string `json:"video_url"`
	MusclesPrimary   string `json:"muscles_primary"`
	MusclesSecondary string `json:"muscles_secondary"`
}
