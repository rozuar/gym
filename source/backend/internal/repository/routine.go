package repository

import (
	"database/sql"
	"fmt"
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
	query := `INSERT INTO routines (name, description, type, content, content_scaled, content_beginner, duration, difficulty, instructor_id, created_by, active, billable, target_user_id, is_custom)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13)
			  RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query, routine.Name, routine.Description, routine.Type,
		routine.Content, routine.ContentScaled, routine.ContentBeginner,
		routine.Duration, routine.Difficulty, routine.InstructorID, routine.CreatedBy,
		routine.Billable, routine.TargetUserID, routine.IsCustom).
		Scan(&routine.ID, &routine.CreatedAt, &routine.UpdatedAt)
}

func (r *RoutineRepository) GetByID(id int64) (*models.RoutineWithCreator, error) {
	routine := &models.RoutineWithCreator{}
	query := `SELECT r.id, r.name, r.description, r.type, r.content, COALESCE(r.content_scaled,''), COALESCE(r.content_beginner,''),
			         r.duration, r.difficulty,
			         r.instructor_id, r.created_by, r.active, r.billable, r.target_user_id, r.is_custom,
			         r.created_at, r.updated_at, u.name, i.name, tu.name
			  FROM routines r
			  JOIN users u ON r.created_by = u.id
			  LEFT JOIN instructors i ON r.instructor_id = i.id
			  LEFT JOIN users tu ON r.target_user_id = tu.id
			  WHERE r.id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&routine.ID, &routine.Name, &routine.Description, &routine.Type, &routine.Content,
		&routine.ContentScaled, &routine.ContentBeginner,
		&routine.Duration, &routine.Difficulty, &routine.InstructorID, &routine.CreatedBy, &routine.Active,
		&routine.Billable, &routine.TargetUserID, &routine.IsCustom,
		&routine.CreatedAt, &routine.UpdatedAt, &routine.CreatorName, &routine.InstructorName, &routine.TargetUserName,
	)
	if err != nil {
		return nil, err
	}
	return routine, nil
}

func (r *RoutineRepository) List(routineType string, custom *bool, limit, offset int) ([]*models.RoutineWithCreator, error) {
	query := `SELECT r.id, r.name, r.description, r.type, r.content, COALESCE(r.content_scaled,''), COALESCE(r.content_beginner,''),
			         r.duration, r.difficulty,
			         r.instructor_id, r.created_by, r.active, r.billable, r.target_user_id, r.is_custom,
			         r.created_at, r.updated_at, u.name, i.name, tu.name
			  FROM routines r
			  JOIN users u ON r.created_by = u.id
			  LEFT JOIN instructors i ON r.instructor_id = i.id
			  LEFT JOIN users tu ON r.target_user_id = tu.id
			  WHERE r.active = true`

	argN := 1
	args := []interface{}{}
	if routineType != "" {
		query += fmt.Sprintf(" AND r.type = $%d", argN)
		args = append(args, routineType)
		argN++
	}
	if custom != nil {
		query += fmt.Sprintf(" AND r.is_custom = $%d", argN)
		args = append(args, *custom)
		argN++
	}
	query += " ORDER BY r.created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argN, argN+1)
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
			&routine.ContentScaled, &routine.ContentBeginner,
			&routine.Duration, &routine.Difficulty, &routine.InstructorID, &routine.CreatedBy, &routine.Active,
			&routine.Billable, &routine.TargetUserID, &routine.IsCustom,
			&routine.CreatedAt, &routine.UpdatedAt, &routine.CreatorName, &routine.InstructorName, &routine.TargetUserName,
		); err != nil {
			return nil, err
		}
		routines = append(routines, routine)
	}
	return routines, nil
}

func (r *RoutineRepository) Update(routine *models.Routine) error {
	query := `UPDATE routines SET name=$1, description=$2, type=$3, content=$4, content_scaled=$5, content_beginner=$6, duration=$7, difficulty=$8, instructor_id=$9, active=$10, billable=$11, target_user_id=$12, is_custom=$13, updated_at=$14 WHERE id=$15`
	routine.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, routine.Name, routine.Description, routine.Type, routine.Content,
		routine.ContentScaled, routine.ContentBeginner,
		routine.Duration, routine.Difficulty, routine.InstructorID, routine.Active,
		routine.Billable, routine.TargetUserID, routine.IsCustom, routine.UpdatedAt, routine.ID)
	return err
}

func (r *RoutineRepository) Delete(id int64) error {
	_, err := r.db.Exec("UPDATE routines SET active = false WHERE id = $1", id)
	return err
}

func (r *RoutineRepository) ListCustom(targetUserID *int64) ([]*models.RoutineWithCreator, error) {
	query := `SELECT r.id, r.name, r.description, r.type, r.content, COALESCE(r.content_scaled,''), COALESCE(r.content_beginner,''),
			         r.duration, r.difficulty,
			         r.instructor_id, r.created_by, r.active, r.billable, r.target_user_id, r.is_custom,
			         r.created_at, r.updated_at, u.name, i.name, tu.name
			  FROM routines r
			  JOIN users u ON r.created_by = u.id
			  LEFT JOIN instructors i ON r.instructor_id = i.id
			  LEFT JOIN users tu ON r.target_user_id = tu.id
			  WHERE r.active = true AND r.is_custom = true`

	args := []interface{}{}
	if targetUserID != nil {
		query += " AND r.target_user_id = $1"
		args = append(args, *targetUserID)
	}
	query += " ORDER BY r.created_at DESC"

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
			&routine.ContentScaled, &routine.ContentBeginner,
			&routine.Duration, &routine.Difficulty, &routine.InstructorID, &routine.CreatedBy, &routine.Active,
			&routine.Billable, &routine.TargetUserID, &routine.IsCustom,
			&routine.CreatedAt, &routine.UpdatedAt, &routine.CreatorName, &routine.InstructorName, &routine.TargetUserName,
		); err != nil {
			return nil, err
		}
		routines = append(routines, routine)
	}
	return routines, nil
}

func (r *RoutineRepository) RemoveScheduleRoutine(scheduleID int64) error {
	_, err := r.db.Exec("DELETE FROM schedule_routines WHERE class_schedule_id = $1", scheduleID)
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
			         rt.name, rt.type, rt.content, COALESCE(rt.content_scaled,''), COALESCE(rt.content_beginner,'')
			  FROM schedule_routines sr
			  JOIN routines rt ON sr.routine_id = rt.id
			  WHERE sr.class_schedule_id = $1`

	err := r.db.QueryRow(query, scheduleID).Scan(
		&sr.ID, &sr.ClassScheduleID, &sr.RoutineID, &sr.Notes, &sr.CreatedAt,
		&sr.RoutineName, &sr.RoutineType, &sr.RoutineContent,
		&sr.RoutineContentScaled, &sr.RoutineContentBeginner,
	)
	if err != nil {
		return nil, err
	}
	return sr, nil
}

// User Results

func (r *RoutineRepository) LogResult(result *models.UserRoutineResult) error {
	// Check if this is a PR (first result for this user+routine)
	var count int
	r.db.QueryRow("SELECT COUNT(*) FROM user_routine_results WHERE user_id = $1 AND routine_id = $2",
		result.UserID, result.RoutineID).Scan(&count)
	isPR := count == 0

	query := `INSERT INTO user_routine_results (user_id, routine_id, class_schedule_id, score, notes, rx, is_pr)
			  VALUES ($1, $2, $3, $4, $5, $6, $7)
			  RETURNING id, created_at`
	err := r.db.QueryRow(query, result.UserID, result.RoutineID, result.ClassScheduleID,
		result.Score, result.Notes, result.Rx, isPR).Scan(&result.ID, &result.CreatedAt)
	if err != nil {
		return err
	}
	result.IsPR = isPR
	return nil
}

func (r *RoutineRepository) GetUserResults(userID int64, limit int, offset ...int) ([]*models.UserResultWithDetails, error) {
	off := 0
	if len(offset) > 0 {
		off = offset[0]
	}
	query := `SELECT urr.id, urr.user_id, urr.routine_id, urr.class_schedule_id, urr.score, urr.notes, urr.rx, COALESCE(urr.is_pr, false), urr.created_at,
			         rt.name, rt.type, cs.date,
			         (SELECT COUNT(*) FROM fistbumps fb WHERE fb.result_id = urr.id)
			  FROM user_routine_results urr
			  JOIN routines rt ON urr.routine_id = rt.id
			  LEFT JOIN class_schedules cs ON urr.class_schedule_id = cs.id
			  WHERE urr.user_id = $1
			  ORDER BY urr.created_at DESC
			  LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(query, userID, limit, off)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*models.UserResultWithDetails
	for rows.Next() {
		res := &models.UserResultWithDetails{}
		if err := rows.Scan(
			&res.ID, &res.UserID, &res.RoutineID, &res.ClassScheduleID, &res.Score, &res.Notes, &res.Rx, &res.IsPR, &res.CreatedAt,
			&res.RoutineName, &res.RoutineType, &res.ScheduleDate, &res.FistbumpCount,
		); err != nil {
			return nil, err
		}
		results = append(results, res)
	}
	return results, nil
}

func (r *RoutineRepository) GetRoutineHistory(routineID int64, userID int64) ([]*models.UserRoutineResult, error) {
	query := `SELECT id, user_id, routine_id, class_schedule_id, score, notes, rx, COALESCE(is_pr, false), created_at
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
			&res.Score, &res.Notes, &res.Rx, &res.IsPR, &res.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, res)
	}
	return results, nil
}

func (r *RoutineRepository) GetResultByID(resultID int64) (*models.UserRoutineResult, error) {
	result := &models.UserRoutineResult{}
	query := `SELECT id, user_id, routine_id, class_schedule_id, score, notes, rx, COALESCE(is_pr, false), created_at
			  FROM user_routine_results
			  WHERE id = $1`

	err := r.db.QueryRow(query, resultID).Scan(
		&result.ID, &result.UserID, &result.RoutineID, &result.ClassScheduleID,
		&result.Score, &result.Notes, &result.Rx, &result.IsPR, &result.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *RoutineRepository) UpdateResult(resultID int64, userID int64, score string, notes string, rx bool) error {
	query := `UPDATE user_routine_results
			  SET score = $1, notes = $2, rx = $3
			  WHERE id = $4 AND user_id = $5`
	_, err := r.db.Exec(query, score, notes, rx, resultID, userID)
	return err
}

func (r *RoutineRepository) DeleteResult(resultID int64, userID int64) error {
	query := `DELETE FROM user_routine_results WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, resultID, userID)
	return err
}

func (r *RoutineRepository) GetUserPRs(userID int64) ([]*models.UserResultWithDetails, error) {
	query := `SELECT urr.id, urr.user_id, urr.routine_id, urr.class_schedule_id, urr.score, urr.notes, urr.rx, COALESCE(urr.is_pr, false), urr.created_at,
			         rt.name, rt.type, cs.date,
			         (SELECT COUNT(*) FROM fistbumps fb WHERE fb.result_id = urr.id)
			  FROM user_routine_results urr
			  JOIN routines rt ON urr.routine_id = rt.id
			  LEFT JOIN class_schedules cs ON urr.class_schedule_id = cs.id
			  WHERE urr.user_id = $1 AND urr.is_pr = true
			  ORDER BY urr.created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*models.UserResultWithDetails
	for rows.Next() {
		res := &models.UserResultWithDetails{}
		if err := rows.Scan(
			&res.ID, &res.UserID, &res.RoutineID, &res.ClassScheduleID, &res.Score, &res.Notes, &res.Rx, &res.IsPR, &res.CreatedAt,
			&res.RoutineName, &res.RoutineType, &res.ScheduleDate, &res.FistbumpCount,
		); err != nil {
			return nil, err
		}
		results = append(results, res)
	}
	return results, nil
}

func (r *RoutineRepository) GetLeaderboard(scheduleID int64) ([]*models.LeaderboardEntry, error) {
	query := `SELECT urr.user_id, u.name, urr.score, urr.rx, COALESCE(urr.is_pr, false)
			  FROM user_routine_results urr
			  JOIN users u ON urr.user_id = u.id
			  WHERE urr.class_schedule_id = $1
			  ORDER BY urr.rx DESC, urr.score ASC`

	rows, err := r.db.Query(query, scheduleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*models.LeaderboardEntry
	for rows.Next() {
		e := &models.LeaderboardEntry{}
		if err := rows.Scan(&e.UserID, &e.UserName, &e.Score, &e.Rx, &e.IsPR); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, nil
}
