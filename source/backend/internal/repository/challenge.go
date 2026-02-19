package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type ChallengeRepository struct {
	db *sql.DB
}

func NewChallengeRepository(db *sql.DB) *ChallengeRepository {
	return &ChallengeRepository{db: db}
}

func (r *ChallengeRepository) Create(c *models.Challenge) error {
	query := `INSERT INTO challenges (name, description, goal, type, start_date, end_date, active, created_by)
			  VALUES ($1, $2, $3, $4, $5, $6, true, $7)
			  RETURNING id, created_at`
	return r.db.QueryRow(query, c.Name, c.Description, c.Goal, c.Type, c.StartDate, c.EndDate, c.CreatedBy).
		Scan(&c.ID, &c.CreatedAt)
}

func (r *ChallengeRepository) GetByID(id int64) (*models.Challenge, error) {
	c := &models.Challenge{}
	query := `SELECT id, name, description, goal, type, start_date, end_date, active, created_by, created_at,
			         (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = challenges.id)
			  FROM challenges WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(
		&c.ID, &c.Name, &c.Description, &c.Goal, &c.Type,
		&c.StartDate, &c.EndDate, &c.Active, &c.CreatedBy, &c.CreatedAt,
		&c.ParticipantCount,
	)
	return c, err
}

func (r *ChallengeRepository) List(activeOnly bool) ([]*models.Challenge, error) {
	query := `SELECT id, name, description, goal, type, start_date, end_date, active, created_by, created_at,
			         (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = challenges.id)
			  FROM challenges`
	if activeOnly {
		query += " WHERE active = true"
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var challenges []*models.Challenge
	for rows.Next() {
		c := &models.Challenge{}
		if err := rows.Scan(
			&c.ID, &c.Name, &c.Description, &c.Goal, &c.Type,
			&c.StartDate, &c.EndDate, &c.Active, &c.CreatedBy, &c.CreatedAt,
			&c.ParticipantCount,
		); err != nil {
			return nil, err
		}
		challenges = append(challenges, c)
	}
	return challenges, nil
}

func (r *ChallengeRepository) Update(c *models.Challenge) error {
	query := `UPDATE challenges SET name=$1, description=$2, goal=$3, type=$4, start_date=$5, end_date=$6, active=$7 WHERE id=$8`
	_, err := r.db.Exec(query, c.Name, c.Description, c.Goal, c.Type, c.StartDate, c.EndDate, c.Active, c.ID)
	return err
}

func (r *ChallengeRepository) Delete(id int64) error {
	_, err := r.db.Exec("UPDATE challenges SET active = false WHERE id = $1", id)
	return err
}

func (r *ChallengeRepository) Join(challengeID, userID int64) error {
	query := `INSERT INTO challenge_participants (challenge_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(query, challengeID, userID)
	return err
}

func (r *ChallengeRepository) Leave(challengeID, userID int64) error {
	_, err := r.db.Exec(`DELETE FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2`, challengeID, userID)
	return err
}

func (r *ChallengeRepository) SubmitProgress(challengeID, userID int64, score, notes string) error {
	var completedAt *time.Time
	if score != "" {
		now := time.Now()
		completedAt = &now
	}
	query := `UPDATE challenge_participants SET score=$1, notes=$2, completed_at=$3 WHERE challenge_id=$4 AND user_id=$5`
	_, err := r.db.Exec(query, score, notes, completedAt, challengeID, userID)
	return err
}

func (r *ChallengeRepository) GetParticipants(challengeID int64) ([]*models.ChallengeParticipant, error) {
	query := `SELECT cp.id, cp.challenge_id, cp.user_id, cp.score, cp.notes, cp.completed_at, cp.created_at, u.name
			  FROM challenge_participants cp
			  JOIN users u ON cp.user_id = u.id
			  WHERE cp.challenge_id = $1
			  ORDER BY cp.completed_at DESC NULLS LAST, cp.created_at ASC`

	rows, err := r.db.Query(query, challengeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var participants []*models.ChallengeParticipant
	for rows.Next() {
		p := &models.ChallengeParticipant{}
		if err := rows.Scan(&p.ID, &p.ChallengeID, &p.UserID, &p.Score, &p.Notes, &p.CompletedAt, &p.CreatedAt, &p.UserName); err != nil {
			return nil, err
		}
		participants = append(participants, p)
	}
	return participants, nil
}

func (r *ChallengeRepository) IsParticipant(challengeID, userID int64) (bool, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2`, challengeID, userID).Scan(&count)
	return count > 0, err
}

func (r *ChallengeRepository) GetUserChallenges(userID int64) ([]*models.Challenge, error) {
	query := `SELECT c.id, c.name, c.description, c.goal, c.type, c.start_date, c.end_date, c.active, c.created_by, c.created_at,
			         (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id)
			  FROM challenges c
			  JOIN challenge_participants cp ON c.id = cp.challenge_id
			  WHERE cp.user_id = $1 AND c.active = true
			  ORDER BY c.created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var challenges []*models.Challenge
	for rows.Next() {
		c := &models.Challenge{}
		if err := rows.Scan(
			&c.ID, &c.Name, &c.Description, &c.Goal, &c.Type,
			&c.StartDate, &c.EndDate, &c.Active, &c.CreatedBy, &c.CreatedAt,
			&c.ParticipantCount,
		); err != nil {
			return nil, err
		}
		challenges = append(challenges, c)
	}
	return challenges, nil
}
