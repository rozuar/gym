package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type LeadRepository struct {
	db *sql.DB
}

func NewLeadRepository(db *sql.DB) *LeadRepository {
	return &LeadRepository{db: db}
}

func (r *LeadRepository) Create(lead *models.Lead) error {
	query := `INSERT INTO leads (name, email, phone, source, status, notes, assigned_to)
			  VALUES ($1, $2, $3, $4, $5, $6, $7)
			  RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, lead.Name, lead.Email, lead.Phone, lead.Source, lead.Status, lead.Notes, lead.AssignedTo).
		Scan(&lead.ID, &lead.CreatedAt, &lead.UpdatedAt)
}

func (r *LeadRepository) GetByID(id int64) (*models.Lead, error) {
	lead := &models.Lead{}
	query := `SELECT l.id, l.name, l.email, l.phone, l.source, l.status, l.notes, l.assigned_to, COALESCE(u.name,''), l.created_at, l.updated_at
			  FROM leads l
			  LEFT JOIN users u ON l.assigned_to = u.id
			  WHERE l.id = $1`
	err := r.db.QueryRow(query, id).Scan(
		&lead.ID, &lead.Name, &lead.Email, &lead.Phone, &lead.Source, &lead.Status, &lead.Notes,
		&lead.AssignedTo, &lead.AssigneeName, &lead.CreatedAt, &lead.UpdatedAt,
	)
	return lead, err
}

func (r *LeadRepository) List(status string) ([]*models.Lead, error) {
	query := `SELECT l.id, l.name, l.email, l.phone, l.source, l.status, l.notes, l.assigned_to, COALESCE(u.name,''), l.created_at, l.updated_at
			  FROM leads l
			  LEFT JOIN users u ON l.assigned_to = u.id`
	args := []interface{}{}
	if status != "" {
		query += " WHERE l.status = $1"
		args = append(args, status)
	}
	query += " ORDER BY l.created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var leads []*models.Lead
	for rows.Next() {
		l := &models.Lead{}
		if err := rows.Scan(
			&l.ID, &l.Name, &l.Email, &l.Phone, &l.Source, &l.Status, &l.Notes,
			&l.AssignedTo, &l.AssigneeName, &l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			return nil, err
		}
		leads = append(leads, l)
	}
	return leads, nil
}

func (r *LeadRepository) Update(lead *models.Lead) error {
	lead.UpdatedAt = time.Now()
	query := `UPDATE leads SET name=$1, email=$2, phone=$3, source=$4, status=$5, notes=$6, assigned_to=$7, updated_at=$8 WHERE id=$9`
	_, err := r.db.Exec(query, lead.Name, lead.Email, lead.Phone, lead.Source, lead.Status, lead.Notes, lead.AssignedTo, lead.UpdatedAt, lead.ID)
	return err
}

func (r *LeadRepository) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM leads WHERE id = $1", id)
	return err
}

func (r *LeadRepository) CountByStatus() (map[string]int64, error) {
	rows, err := r.db.Query("SELECT status, COUNT(*) FROM leads GROUP BY status")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := map[string]int64{}
	for rows.Next() {
		var status string
		var count int64
		rows.Scan(&status, &count)
		result[status] = count
	}
	return result, nil
}
