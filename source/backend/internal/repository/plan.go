package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type PlanRepository struct {
	db *sql.DB
}

func NewPlanRepository(db *sql.DB) *PlanRepository {
	return &PlanRepository{db: db}
}

func (r *PlanRepository) Create(plan *models.Plan) error {
	query := `
		INSERT INTO plans (name, description, price, currency, duration, max_classes, active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		plan.Name,
		plan.Description,
		plan.Price,
		plan.Currency,
		plan.Duration,
		plan.MaxClasses,
		plan.Active,
	).Scan(&plan.ID, &plan.CreatedAt, &plan.UpdatedAt)
}

func (r *PlanRepository) GetByID(id int64) (*models.Plan, error) {
	plan := &models.Plan{}
	query := `SELECT id, name, description, price, currency, duration, max_classes, active, created_at, updated_at
			  FROM plans WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&plan.ID,
		&plan.Name,
		&plan.Description,
		&plan.Price,
		&plan.Currency,
		&plan.Duration,
		&plan.MaxClasses,
		&plan.Active,
		&plan.CreatedAt,
		&plan.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return plan, nil
}

func (r *PlanRepository) List(activeOnly bool) ([]*models.Plan, error) {
	query := `SELECT id, name, description, price, currency, duration, max_classes, active, created_at, updated_at
			  FROM plans`
	if activeOnly {
		query += " WHERE active = true"
	}
	query += " ORDER BY price ASC"

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []*models.Plan
	for rows.Next() {
		plan := &models.Plan{}
		err := rows.Scan(
			&plan.ID,
			&plan.Name,
			&plan.Description,
			&plan.Price,
			&plan.Currency,
			&plan.Duration,
			&plan.MaxClasses,
			&plan.Active,
			&plan.CreatedAt,
			&plan.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		plans = append(plans, plan)
	}
	return plans, nil
}

func (r *PlanRepository) Update(plan *models.Plan) error {
	query := `
		UPDATE plans
		SET name = $1, description = $2, price = $3, duration = $4, max_classes = $5, active = $6, updated_at = $7
		WHERE id = $8`

	plan.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, plan.Name, plan.Description, plan.Price, plan.Duration, plan.MaxClasses, plan.Active, plan.UpdatedAt, plan.ID)
	return err
}

func (r *PlanRepository) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM plans WHERE id = $1", id)
	return err
}
