package repository

import (
	"database/sql"

	"boxmagic/internal/models"
)

type BadgeRepository struct {
	db *sql.DB
}

func NewBadgeRepository(db *sql.DB) *BadgeRepository {
	return &BadgeRepository{db: db}
}

func (r *BadgeRepository) AwardBadge(userID int64, badgeType string) error {
	_, err := r.db.Exec(
		`INSERT INTO user_badges (user_id, badge_type) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, badgeType,
	)
	return err
}

func (r *BadgeRepository) GetUserBadges(userID int64) ([]*models.UserBadge, error) {
	rows, err := r.db.Query(
		`SELECT id, user_id, badge_type, awarded_at FROM user_badges WHERE user_id = $1 ORDER BY awarded_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var badges []*models.UserBadge
	for rows.Next() {
		b := &models.UserBadge{}
		if err := rows.Scan(&b.ID, &b.UserID, &b.BadgeType, &b.AwardedAt); err != nil {
			return nil, err
		}
		if info, ok := models.BadgeCatalog[b.BadgeType]; ok {
			b.Name = info.Name
			b.Description = info.Description
			b.Icon = info.Icon
		}
		badges = append(badges, b)
	}
	return badges, nil
}

func (r *BadgeRepository) HasBadge(userID int64, badgeType string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM user_badges WHERE user_id = $1 AND badge_type = $2`,
		userID, badgeType,
	).Scan(&count)
	return count > 0, err
}

func (r *BadgeRepository) CountCheckins(userID int64) (int, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status IN ('attended', 'booked', 'checked_in')`,
		userID,
	).Scan(&count)
	return count, err
}

func (r *BadgeRepository) CountPRs(userID int64) (int, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM user_routine_results WHERE user_id = $1 AND is_pr = true`,
		userID,
	).Scan(&count)
	return count, err
}

func (r *BadgeRepository) HasRxResult(userID int64) (bool, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM user_routine_results WHERE user_id = $1 AND rx = true`,
		userID,
	).Scan(&count)
	return count > 0, err
}
