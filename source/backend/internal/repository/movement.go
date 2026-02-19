package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"boxmagic/internal/models"
)

type MovementRepository struct {
	db *sql.DB
}

func NewMovementRepository(db *sql.DB) *MovementRepository {
	return &MovementRepository{db: db}
}

func (r *MovementRepository) List(category string, search string, activeOnly bool) ([]*models.Movement, error) {
	q := `SELECT id, name, COALESCE(description,''), COALESCE(category,'other'), COALESCE(video_url,''), COALESCE(muscles_primary,''), COALESCE(muscles_secondary,''), active, created_at FROM movements WHERE 1=1`
	args := []interface{}{}
	n := 1
	if activeOnly {
		q += ` AND active = true`
	}
	if category != "" {
		q += fmt.Sprintf(` AND category = $%d`, n)
		args = append(args, category)
		n++
	}
	if search != "" {
		q += fmt.Sprintf(` AND LOWER(name) LIKE $%d`, n)
		args = append(args, "%"+strings.ToLower(search)+"%")
	}
	q += ` ORDER BY name ASC`
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Movement
	for rows.Next() {
		m := &models.Movement{}
		if err := rows.Scan(&m.ID, &m.Name, &m.Description, &m.Category, &m.VideoURL, &m.MusclesPrimary, &m.MusclesSecondary, &m.Active, &m.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *MovementRepository) GetByID(id int64) (*models.Movement, error) {
	m := &models.Movement{}
	err := r.db.QueryRow(`SELECT id, name, COALESCE(description,''), COALESCE(category,'other'), COALESCE(video_url,''), COALESCE(muscles_primary,''), COALESCE(muscles_secondary,''), active, created_at FROM movements WHERE id = $1`, id).
		Scan(&m.ID, &m.Name, &m.Description, &m.Category, &m.VideoURL, &m.MusclesPrimary, &m.MusclesSecondary, &m.Active, &m.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return m, err
}

func (r *MovementRepository) Create(m *models.Movement) error {
	return r.db.QueryRow(
		`INSERT INTO movements (name, description, category, video_url, muscles_primary, muscles_secondary, active) VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id, created_at`,
		m.Name, m.Description, m.Category, m.VideoURL, m.MusclesPrimary, m.MusclesSecondary,
	).Scan(&m.ID, &m.CreatedAt)
}

func (r *MovementRepository) Update(m *models.Movement) error {
	_, err := r.db.Exec(
		`UPDATE movements SET name=$1, description=$2, category=$3, video_url=$4, muscles_primary=$5, muscles_secondary=$6, active=$7 WHERE id=$8`,
		m.Name, m.Description, m.Category, m.VideoURL, m.MusclesPrimary, m.MusclesSecondary, m.Active, m.ID,
	)
	return err
}

func (r *MovementRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM movements WHERE id=$1`, id)
	return err
}
