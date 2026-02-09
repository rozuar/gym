package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type InstructorRepository struct {
	db *sql.DB
}

func NewInstructorRepository(db *sql.DB) *InstructorRepository {
	return &InstructorRepository{db: db}
}

func (r *InstructorRepository) Create(instructor *models.Instructor) error {
	query := `INSERT INTO instructors (name, email, phone, specialty, bio, active)
			  VALUES ($1, $2, $3, $4, $5, true)
			  RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, instructor.Name, instructor.Email, instructor.Phone,
		instructor.Specialty, instructor.Bio).Scan(&instructor.ID, &instructor.CreatedAt, &instructor.UpdatedAt)
}

func (r *InstructorRepository) GetByID(id int64) (*models.Instructor, error) {
	instructor := &models.Instructor{}
	query := `SELECT id, name, email, phone, specialty, bio, active, created_at, updated_at
			  FROM instructors WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&instructor.ID, &instructor.Name, &instructor.Email, &instructor.Phone,
		&instructor.Specialty, &instructor.Bio, &instructor.Active,
		&instructor.CreatedAt, &instructor.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return instructor, nil
}

func (r *InstructorRepository) List(activeOnly bool) ([]*models.Instructor, error) {
	query := `SELECT id, name, email, phone, specialty, bio, active, created_at, updated_at
			  FROM instructors`
	if activeOnly {
		query += " WHERE active = true"
	}
	query += " ORDER BY name"

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var instructors []*models.Instructor
	for rows.Next() {
		instructor := &models.Instructor{}
		if err := rows.Scan(
			&instructor.ID, &instructor.Name, &instructor.Email, &instructor.Phone,
			&instructor.Specialty, &instructor.Bio, &instructor.Active,
			&instructor.CreatedAt, &instructor.UpdatedAt,
		); err != nil {
			return nil, err
		}
		instructors = append(instructors, instructor)
	}
	return instructors, nil
}

func (r *InstructorRepository) Update(instructor *models.Instructor) error {
	query := `UPDATE instructors SET name=$1, email=$2, phone=$3, specialty=$4, bio=$5, active=$6, updated_at=$7 WHERE id=$8`
	instructor.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, instructor.Name, instructor.Email, instructor.Phone,
		instructor.Specialty, instructor.Bio, instructor.Active, instructor.UpdatedAt, instructor.ID)
	return err
}

func (r *InstructorRepository) Delete(id int64) error {
	_, err := r.db.Exec("UPDATE instructors SET active = false WHERE id = $1", id)
	return err
}

// Class-Instructor relationships

func (r *InstructorRepository) AssignToClass(classID int64, instructorIDs []int64) error {
	// Delete existing assignments
	_, err := r.db.Exec("DELETE FROM class_instructors WHERE class_id = $1", classID)
	if err != nil {
		return err
	}

	// Validate: 1-2 instructors max
	if len(instructorIDs) > 2 {
		instructorIDs = instructorIDs[:2]
	}

	// Insert new assignments
	for _, instructorID := range instructorIDs {
		_, err = r.db.Exec(
			"INSERT INTO class_instructors (class_id, instructor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			classID, instructorID,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *InstructorRepository) GetClassInstructors(classID int64) ([]*models.Instructor, error) {
	query := `SELECT i.id, i.name, i.email, i.phone, i.specialty, i.bio, i.active, i.created_at, i.updated_at
			  FROM instructors i
			  JOIN class_instructors ci ON i.id = ci.instructor_id
			  WHERE ci.class_id = $1 AND i.active = true
			  ORDER BY i.name`

	rows, err := r.db.Query(query, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var instructors []*models.Instructor
	for rows.Next() {
		instructor := &models.Instructor{}
		if err := rows.Scan(
			&instructor.ID, &instructor.Name, &instructor.Email, &instructor.Phone,
			&instructor.Specialty, &instructor.Bio, &instructor.Active,
			&instructor.CreatedAt, &instructor.UpdatedAt,
		); err != nil {
			return nil, err
		}
		instructors = append(instructors, instructor)
	}
	return instructors, nil
}
