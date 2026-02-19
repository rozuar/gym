package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type DiscountCodeRepository struct {
	db *sql.DB
}

func NewDiscountCodeRepository(db *sql.DB) *DiscountCodeRepository {
	return &DiscountCodeRepository{db: db}
}

func (r *DiscountCodeRepository) Create(code *models.DiscountCode) error {
	query := `
		INSERT INTO discount_codes (code, description, discount_type, discount_value, max_uses, valid_until, active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at`
	return r.db.QueryRow(query,
		code.Code, code.Description, code.DiscountType, code.DiscountValue,
		code.MaxUses, code.ValidUntil, code.Active,
	).Scan(&code.ID, &code.CreatedAt)
}

func (r *DiscountCodeRepository) GetByCode(code string) (*models.DiscountCode, error) {
	dc := &models.DiscountCode{}
	query := `
		SELECT id, code, COALESCE(description,''), discount_type, discount_value,
		       max_uses, uses_count, valid_until, active, created_at
		FROM discount_codes WHERE code = $1`
	err := r.db.QueryRow(query, code).Scan(
		&dc.ID, &dc.Code, &dc.Description, &dc.DiscountType, &dc.DiscountValue,
		&dc.MaxUses, &dc.UsesCount, &dc.ValidUntil, &dc.Active, &dc.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return dc, nil
}

func (r *DiscountCodeRepository) List(activeOnly bool) ([]*models.DiscountCode, error) {
	query := `
		SELECT id, code, COALESCE(description,''), discount_type, discount_value,
		       max_uses, uses_count, valid_until, active, created_at
		FROM discount_codes`
	if activeOnly {
		query += ` WHERE active = true`
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var codes []*models.DiscountCode
	for rows.Next() {
		dc := &models.DiscountCode{}
		if err := rows.Scan(
			&dc.ID, &dc.Code, &dc.Description, &dc.DiscountType, &dc.DiscountValue,
			&dc.MaxUses, &dc.UsesCount, &dc.ValidUntil, &dc.Active, &dc.CreatedAt,
		); err != nil {
			return nil, err
		}
		codes = append(codes, dc)
	}
	return codes, nil
}

func (r *DiscountCodeRepository) Delete(id int64) error {
	_, err := r.db.Exec(`UPDATE discount_codes SET active = false WHERE id = $1`, id)
	return err
}

func (r *DiscountCodeRepository) IncrementUses(id int64) error {
	_, err := r.db.Exec(`UPDATE discount_codes SET uses_count = uses_count + 1 WHERE id = $1`, id)
	return err
}

// Validate checks if a code is valid and returns it. Returns error if invalid.
func (r *DiscountCodeRepository) Validate(code string) (*models.DiscountCode, error) {
	dc, err := r.GetByCode(code)
	if err != nil {
		return nil, err
	}
	if !dc.Active {
		return nil, sql.ErrNoRows
	}
	if dc.MaxUses > 0 && dc.UsesCount >= dc.MaxUses {
		return nil, sql.ErrNoRows
	}
	if dc.ValidUntil != nil && dc.ValidUntil.Before(time.Now()) {
		return nil, sql.ErrNoRows
	}
	return dc, nil
}
