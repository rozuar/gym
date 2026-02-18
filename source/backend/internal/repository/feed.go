package repository

import (
	"database/sql"

	"boxmagic/internal/models"
)

type FeedRepository struct {
	db *sql.DB
}

func NewFeedRepository(db *sql.DB) *FeedRepository {
	return &FeedRepository{db: db}
}

func (r *FeedRepository) CreateEvent(event *models.FeedEvent) error {
	return r.db.QueryRow(
		`INSERT INTO feed_events (user_id, event_type, ref_id, data_json) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
		event.UserID, event.EventType, event.RefID, event.DataJSON,
	).Scan(&event.ID, &event.CreatedAt)
}

func (r *FeedRepository) GetFeed(limit, offset int) ([]*models.FeedEventWithUser, error) {
	rows, err := r.db.Query(
		`SELECT f.id, f.user_id, f.event_type, f.ref_id, COALESCE(f.data_json,''), f.created_at,
		        u.name, COALESCE(u.avatar_url,'')
		 FROM feed_events f
		 JOIN users u ON f.user_id = u.id
		 ORDER BY f.created_at DESC
		 LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*models.FeedEventWithUser
	for rows.Next() {
		e := &models.FeedEventWithUser{}
		if err := rows.Scan(&e.ID, &e.UserID, &e.EventType, &e.RefID, &e.DataJSON, &e.CreatedAt, &e.UserName, &e.AvatarURL); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}

func (r *FeedRepository) CreateFistbump(userID, resultID int64) (*models.Fistbump, error) {
	fb := &models.Fistbump{UserID: userID, ResultID: resultID}
	err := r.db.QueryRow(
		`INSERT INTO fistbumps (user_id, result_id) VALUES ($1, $2) RETURNING id, created_at`,
		userID, resultID,
	).Scan(&fb.ID, &fb.CreatedAt)
	if err != nil {
		return nil, err
	}
	return fb, nil
}

func (r *FeedRepository) DeleteFistbump(userID, resultID int64) error {
	_, err := r.db.Exec("DELETE FROM fistbumps WHERE user_id = $1 AND result_id = $2", userID, resultID)
	return err
}
