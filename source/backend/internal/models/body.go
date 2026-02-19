package models

import "time"

type BodyMeasurement struct {
	ID          int64      `json:"id"`
	UserID      int64      `json:"user_id"`
	WeightKg    *float64   `json:"weight_kg,omitempty"`
	BodyFatPct  *float64   `json:"body_fat_pct,omitempty"`
	ChestCm     *float64   `json:"chest_cm,omitempty"`
	WaistCm     *float64   `json:"waist_cm,omitempty"`
	HipCm       *float64   `json:"hip_cm,omitempty"`
	ArmCm       *float64   `json:"arm_cm,omitempty"`
	ThighCm     *float64   `json:"thigh_cm,omitempty"`
	Notes       string     `json:"notes,omitempty"`
	PhotoURL    string     `json:"photo_url,omitempty"`
	MeasuredAt  time.Time  `json:"measured_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

type CreateBodyMeasurementRequest struct {
	WeightKg   *float64 `json:"weight_kg,omitempty"`
	BodyFatPct *float64 `json:"body_fat_pct,omitempty"`
	ChestCm    *float64 `json:"chest_cm,omitempty"`
	WaistCm    *float64 `json:"waist_cm,omitempty"`
	HipCm      *float64 `json:"hip_cm,omitempty"`
	ArmCm      *float64 `json:"arm_cm,omitempty"`
	ThighCm    *float64 `json:"thigh_cm,omitempty"`
	Notes      string   `json:"notes,omitempty"`
	PhotoURL   string   `json:"photo_url,omitempty"`
	MeasuredAt string   `json:"measured_at,omitempty"` // YYYY-MM-DD
}
