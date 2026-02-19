package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type BodyRepository struct {
	db *sql.DB
}

func NewBodyRepository(db *sql.DB) *BodyRepository {
	return &BodyRepository{db: db}
}

func (r *BodyRepository) Create(m *models.BodyMeasurement) error {
	query := `INSERT INTO body_measurements (user_id, weight_kg, body_fat_pct, chest_cm, waist_cm, hip_cm, arm_cm, thigh_cm, notes, photo_url, measured_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			  RETURNING id, created_at`
	return r.db.QueryRow(query,
		m.UserID, m.WeightKg, m.BodyFatPct, m.ChestCm, m.WaistCm, m.HipCm, m.ArmCm, m.ThighCm,
		m.Notes, m.PhotoURL, m.MeasuredAt,
	).Scan(&m.ID, &m.CreatedAt)
}

func (r *BodyRepository) List(userID int64, limit int) ([]*models.BodyMeasurement, error) {
	query := `SELECT id, user_id, weight_kg, body_fat_pct, chest_cm, waist_cm, hip_cm, arm_cm, thigh_cm, notes, photo_url, measured_at, created_at
			  FROM body_measurements WHERE user_id = $1 ORDER BY measured_at DESC LIMIT $2`
	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var measurements []*models.BodyMeasurement
	for rows.Next() {
		m := &models.BodyMeasurement{}
		if err := rows.Scan(
			&m.ID, &m.UserID, &m.WeightKg, &m.BodyFatPct, &m.ChestCm, &m.WaistCm, &m.HipCm, &m.ArmCm, &m.ThighCm,
			&m.Notes, &m.PhotoURL, &m.MeasuredAt, &m.CreatedAt,
		); err != nil {
			return nil, err
		}
		measurements = append(measurements, m)
	}
	return measurements, nil
}

func (r *BodyRepository) Delete(id int64, userID int64) error {
	_, err := r.db.Exec("DELETE FROM body_measurements WHERE id = $1 AND user_id = $2", id, userID)
	return err
}

func (r *BodyRepository) Latest(userID int64) (*models.BodyMeasurement, error) {
	m := &models.BodyMeasurement{}
	query := `SELECT id, user_id, weight_kg, body_fat_pct, chest_cm, waist_cm, hip_cm, arm_cm, thigh_cm, notes, photo_url, measured_at, created_at
			  FROM body_measurements WHERE user_id = $1 ORDER BY measured_at DESC LIMIT 1`
	err := r.db.QueryRow(query, userID).Scan(
		&m.ID, &m.UserID, &m.WeightKg, &m.BodyFatPct, &m.ChestCm, &m.WaistCm, &m.HipCm, &m.ArmCm, &m.ThighCm,
		&m.Notes, &m.PhotoURL, &m.MeasuredAt, &m.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return m, err
}

// Needed for timezone scan
var _ = time.Now
