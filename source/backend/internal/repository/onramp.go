package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type OnrampRepository struct {
	db *sql.DB
}

func NewOnrampRepository(db *sql.DB) *OnrampRepository {
	return &OnrampRepository{db: db}
}

func (r *OnrampRepository) CreateProgram(p *models.OnrampProgram) error {
	query := `INSERT INTO onramp_programs (name, description, required_sessions) VALUES ($1, $2, $3) RETURNING id, created_at`
	return r.db.QueryRow(query, p.Name, p.Description, p.RequiredSessions).Scan(&p.ID, &p.CreatedAt)
}

func (r *OnrampRepository) UpdateProgram(p *models.OnrampProgram) error {
	query := `UPDATE onramp_programs SET name=$1, description=$2, required_sessions=$3, active=$4 WHERE id=$5`
	_, err := r.db.Exec(query, p.Name, p.Description, p.RequiredSessions, p.Active, p.ID)
	return err
}

func (r *OnrampRepository) DeleteProgram(id int64) error {
	_, err := r.db.Exec("UPDATE onramp_programs SET active = false WHERE id = $1", id)
	return err
}

func (r *OnrampRepository) ListPrograms(activeOnly bool) ([]*models.OnrampProgram, error) {
	query := `SELECT op.id, op.name, op.description, op.required_sessions, op.active, op.created_at,
			         (SELECT COUNT(*) FROM onramp_enrollments WHERE program_id = op.id) as enrolled_count
			  FROM onramp_programs op`
	if activeOnly {
		query += " WHERE op.active = true"
	}
	query += " ORDER BY op.created_at DESC"

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var programs []*models.OnrampProgram
	for rows.Next() {
		p := &models.OnrampProgram{}
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.RequiredSessions, &p.Active, &p.CreatedAt, &p.EnrolledCount); err != nil {
			return nil, err
		}
		programs = append(programs, p)
	}
	return programs, nil
}

func (r *OnrampRepository) Enroll(userID, programID int64) error {
	query := `INSERT INTO onramp_enrollments (user_id, program_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(query, userID, programID)
	return err
}

func (r *OnrampRepository) UpdateSessions(userID, programID int64, sessions int) error {
	var completedAt interface{}
	// Get required sessions to check if completed
	var required int
	r.db.QueryRow("SELECT required_sessions FROM onramp_programs WHERE id = $1", programID).Scan(&required)
	if sessions >= required {
		now := time.Now()
		completedAt = now
	}
	query := `UPDATE onramp_enrollments SET sessions_completed=$1, completed_at=$2 WHERE user_id=$3 AND program_id=$4`
	_, err := r.db.Exec(query, sessions, completedAt, userID, programID)
	return err
}

func (r *OnrampRepository) GetUserEnrollments(userID int64) ([]*models.OnrampEnrollment, error) {
	query := `SELECT oe.id, oe.user_id, oe.program_id, oe.sessions_completed, oe.completed_at, oe.created_at,
			         op.name
			  FROM onramp_enrollments oe
			  JOIN onramp_programs op ON oe.program_id = op.id
			  WHERE oe.user_id = $1
			  ORDER BY oe.created_at DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var enrollments []*models.OnrampEnrollment
	for rows.Next() {
		e := &models.OnrampEnrollment{}
		if err := rows.Scan(&e.ID, &e.UserID, &e.ProgramID, &e.SessionsCompleted, &e.CompletedAt, &e.CreatedAt, &e.ProgramName); err != nil {
			return nil, err
		}
		enrollments = append(enrollments, e)
	}
	return enrollments, nil
}

func (r *OnrampRepository) ListEnrollments(programID int64) ([]*models.OnrampEnrollment, error) {
	query := `SELECT oe.id, oe.user_id, oe.program_id, oe.sessions_completed, oe.completed_at, oe.created_at,
			         u.name, u.email
			  FROM onramp_enrollments oe
			  JOIN users u ON oe.user_id = u.id
			  WHERE oe.program_id = $1
			  ORDER BY oe.sessions_completed DESC, oe.created_at ASC`
	rows, err := r.db.Query(query, programID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var enrollments []*models.OnrampEnrollment
	for rows.Next() {
		e := &models.OnrampEnrollment{}
		if err := rows.Scan(&e.ID, &e.UserID, &e.ProgramID, &e.SessionsCompleted, &e.CompletedAt, &e.CreatedAt, &e.UserName, &e.UserEmail); err != nil {
			return nil, err
		}
		enrollments = append(enrollments, e)
	}
	return enrollments, nil
}
