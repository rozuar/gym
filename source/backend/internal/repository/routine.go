package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type RoutineRepository struct {
	db *sql.DB
}

func NewRoutineRepository(db *sql.DB) *RoutineRepository {
	return &RoutineRepository{db: db}
}

func (r *RoutineRepository) Create(routine *models.Routine) error {
	query := `INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, true)
			  RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, routine.Name, routine.Description, routine.Type,
		routine.Content, routine.Duration, routine.Difficulty, routine.CreatedBy).
		Scan(&routine.ID, &routine.CreatedAt, &routine.UpdatedAt)
}

func (r *RoutineRepository) GetByID(id int64) (*models.RoutineWithCreator, error) {
	routine := &models.RoutineWithCreator{}
	query := `SELECT r.id, r.name, r.description, r.type, r.content, r.duration, r.difficulty,
			         r.created_by, r.active, r.created_at, r.updated_at, u.name
			  FROM routines r
			  JOIN users u ON r.created_by = u.id
			  WHERE r.id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&routine.ID, &routine.Name, &routine.Description, &routine.Type, &routine.Content,
		&routine.Duration, &routine.Difficulty, &routine.CreatedBy, &routine.Active,
		&routine.CreatedAt, &routine.UpdatedAt, &routine.CreatorName,
	)
	if err != nil {
		return nil, err
	}
	return routine, nil
}

func (r *RoutineRepository) List(routineType string, limit, offset int) ([]*models.RoutineWithCreator, error) {
	query := `SELECT r.id, r.name, r.description, r.type, r.content, r.duration, r.difficulty,
			         r.created_by, r.active, r.created_at, r.updated_at, u.name
			  FROM routines r
			  JOIN users u ON r.created_by = u.id
			  WHERE r.active = true`

	args := []interface{}{}
	if routineType != "" {
		query += " AND r.type = $1"
		args = append(args, routineType)
	}
	query += " ORDER BY r.created_at DESC"

	if len(args) > 0 {
		query += " LIMIT $2 OFFSET $3"
	} else {
		query += " LIMIT $1 OFFSET $2"
	}
	args = append(args, limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var routines []*models.RoutineWithCreator
	for rows.Next() {
		routine := &models.RoutineWithCreator{}
		if err := rows.Scan(
			&routine.ID, &routine.Name, &routine.Description, &routine.Type, &routine.Content,
			&routine.Duration, &routine.Difficulty, &routine.CreatedBy, &routine.Active,
			&routine.CreatedAt, &routine.UpdatedAt, &routine.CreatorName,
		); err != nil {
			return nil, err
		}
		routines = append(routines, routine)
	}
	return routines, nil
}

func (r *RoutineRepository) Update(routine *models.Routine) error {
	query := `UPDATE routines SET name=$1, description=$2, type=$3, content=$4, duration=$5, difficulty=$6, active=$7, updated_at=$8 WHERE id=$9`
	routine.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, routine.Name, routine.Description, routine.Type, routine.Content,
		routine.Duration, routine.Difficulty, routine.Active, routine.UpdatedAt, routine.ID)
	return err
}

func (r *RoutineRepository) Delete(id int64) error {
	_, err := r.db.Exec("UPDATE routines SET active = false WHERE id = $1", id)
	return err
}

// Schedule Routines

func (r *RoutineRepository) AssignToSchedule(sr *models.ScheduleRoutine) error {
	query := `INSERT INTO schedule_routines (class_schedule_id, routine_id, notes)
			  VALUES ($1, $2, $3)
			  ON CONFLICT (class_schedule_id) DO UPDATE SET routine_id = $2, notes = $3
			  RETURNING id, created_at`
	return r.db.QueryRow(query, sr.ClassScheduleID, sr.RoutineID, sr.Notes).Scan(&sr.ID, &sr.CreatedAt)
}

func (r *RoutineRepository) GetScheduleRoutine(scheduleID int64) (*models.ScheduleRoutineWithDetails, error) {
	sr := &models.ScheduleRoutineWithDetails{}
	query := `SELECT sr.id, sr.class_schedule_id, sr.routine_id, sr.notes, sr.created_at,
			         rt.name, rt.type, rt.content
			  FROM schedule_routines sr
			  JOIN routines rt ON sr.routine_id = rt.id
			  WHERE sr.class_schedule_id = $1`

	err := r.db.QueryRow(query, scheduleID).Scan(
		&sr.ID, &sr.ClassScheduleID, &sr.RoutineID, &sr.Notes, &sr.CreatedAt,
		&sr.RoutineName, &sr.RoutineType, &sr.RoutineContent,
	)
	if err != nil {
		return nil, err
	}
	return sr, nil
}

// User Results

func (r *RoutineRepository) LogResult(result *models.UserRoutineResult) error {
	query := `INSERT INTO user_routine_results (user_id, routine_id, class_schedule_id, score, notes, rx)
			  VALUES ($1, $2, $3, $4, $5, $6)
			  RETURNING id, created_at`
	return r.db.QueryRow(query, result.UserID, result.RoutineID, result.ClassScheduleID,
		result.Score, result.Notes, result.Rx).Scan(&result.ID, &result.CreatedAt)
}

func (r *RoutineRepository) GetUserResults(userID int64, limit int) ([]*models.UserResultWithDetails, error) {
	query := `SELECT urr.id, urr.user_id, urr.routine_id, urr.class_schedule_id, urr.score, urr.notes, urr.rx, urr.created_at,
			         rt.name, rt.type, cs.date
			  FROM user_routine_results urr
			  JOIN routines rt ON urr.routine_id = rt.id
			  LEFT JOIN class_schedules cs ON urr.class_schedule_id = cs.id
			  WHERE urr.user_id = $1
			  ORDER BY urr.created_at DESC
			  LIMIT $2`

	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*models.UserResultWithDetails
	for rows.Next() {
		res := &models.UserResultWithDetails{}
		if err := rows.Scan(
			&res.ID, &res.UserID, &res.RoutineID, &res.ClassScheduleID, &res.Score, &res.Notes, &res.Rx, &res.CreatedAt,
			&res.RoutineName, &res.RoutineType, &res.ScheduleDate,
		); err != nil {
			return nil, err
		}
		results = append(results, res)
	}
	return results, nil
}

func (r *RoutineRepository) GetRoutineHistory(routineID int64, userID int64) ([]*models.UserRoutineResult, error) {
	query := `SELECT id, user_id, routine_id, class_schedule_id, score, notes, rx, created_at
			  FROM user_routine_results
			  WHERE routine_id = $1 AND user_id = $2
			  ORDER BY created_at DESC`

	rows, err := r.db.Query(query, routineID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*models.UserRoutineResult
	for rows.Next() {
		res := &models.UserRoutineResult{}
		if err := rows.Scan(&res.ID, &res.UserID, &res.RoutineID, &res.ClassScheduleID,
			&res.Score, &res.Notes, &res.Rx, &res.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, res)
	}
	return results, nil
}
