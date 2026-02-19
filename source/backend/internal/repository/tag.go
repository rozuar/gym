package repository

import (
	"database/sql"

	"boxmagic/internal/models"
)

type TagRepository struct {
	db *sql.DB
}

func NewTagRepository(db *sql.DB) *TagRepository {
	return &TagRepository{db: db}
}

func (r *TagRepository) ListTags() ([]*models.Tag, error) {
	rows, err := r.db.Query(`SELECT id, name, color FROM tags ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Tag
	for rows.Next() {
		t := &models.Tag{}
		if err := rows.Scan(&t.ID, &t.Name, &t.Color); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, nil
}

func (r *TagRepository) CreateTag(t *models.Tag) error {
	return r.db.QueryRow(`INSERT INTO tags (name, color) VALUES ($1,$2) RETURNING id`, t.Name, t.Color).Scan(&t.ID)
}

func (r *TagRepository) UpdateTag(t *models.Tag) error {
	_, err := r.db.Exec(`UPDATE tags SET name=$1, color=$2 WHERE id=$3`, t.Name, t.Color, t.ID)
	return err
}

func (r *TagRepository) DeleteTag(id int64) error {
	_, err := r.db.Exec(`DELETE FROM tags WHERE id=$1`, id)
	return err
}

func (r *TagRepository) GetUserTags(userID int64) ([]*models.Tag, error) {
	rows, err := r.db.Query(`SELECT t.id, t.name, t.color FROM tags t JOIN user_tags ut ON ut.tag_id = t.id WHERE ut.user_id = $1 ORDER BY t.name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Tag
	for rows.Next() {
		t := &models.Tag{}
		if err := rows.Scan(&t.ID, &t.Name, &t.Color); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, nil
}

func (r *TagRepository) AddUserTag(userID int64, tagID int64) error {
	_, err := r.db.Exec(`INSERT INTO user_tags (user_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, userID, tagID)
	return err
}

func (r *TagRepository) RemoveUserTag(userID int64, tagID int64) error {
	_, err := r.db.Exec(`DELETE FROM user_tags WHERE user_id=$1 AND tag_id=$2`, userID, tagID)
	return err
}

// GetUsersWithTag returns user IDs that have a given tag
func (r *TagRepository) GetUsersWithTag(tagID int64) ([]int64, error) {
	rows, err := r.db.Query(`SELECT user_id FROM user_tags WHERE tag_id=$1`, tagID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// ListUsersWithTags returns each user with their tag IDs (for admin user list enrichment)
func (r *TagRepository) ListUserTagMap() (map[int64][]*models.Tag, error) {
	rows, err := r.db.Query(`SELECT ut.user_id, t.id, t.name, t.color FROM user_tags ut JOIN tags t ON t.id = ut.tag_id ORDER BY t.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	m := make(map[int64][]*models.Tag)
	for rows.Next() {
		var userID int64
		t := &models.Tag{}
		if err := rows.Scan(&userID, &t.ID, &t.Name, &t.Color); err != nil {
			return nil, err
		}
		m[userID] = append(m[userID], t)
	}
	return m, nil
}

func (r *TagRepository) GetByID(id int64) (*models.Tag, error) {
	t := &models.Tag{}
	err := r.db.QueryRow(`SELECT id, name, color FROM tags WHERE id=$1`, id).Scan(&t.ID, &t.Name, &t.Color)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return t, err
}
