package repository

import (
	"database/sql"

	"boxmagic/internal/models"
)

type CommentRepository struct {
	db *sql.DB
}

func NewCommentRepository(db *sql.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

func (r *CommentRepository) Create(c *models.ResultComment) error {
	query := `INSERT INTO result_comments (result_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, created_at`
	return r.db.QueryRow(query, c.ResultID, c.UserID, c.Content).Scan(&c.ID, &c.CreatedAt)
}

func (r *CommentRepository) ListByResult(resultID int64) ([]*models.ResultComment, error) {
	query := `SELECT rc.id, rc.result_id, rc.user_id, u.name, COALESCE(u.avatar_url,''), rc.content, rc.created_at
			  FROM result_comments rc
			  JOIN users u ON rc.user_id = u.id
			  WHERE rc.result_id = $1
			  ORDER BY rc.created_at ASC`
	rows, err := r.db.Query(query, resultID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*models.ResultComment
	for rows.Next() {
		c := &models.ResultComment{}
		if err := rows.Scan(&c.ID, &c.ResultID, &c.UserID, &c.UserName, &c.AvatarURL, &c.Content, &c.CreatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, nil
}

func (r *CommentRepository) Delete(commentID, userID int64) error {
	_, err := r.db.Exec("DELETE FROM result_comments WHERE id = $1 AND user_id = $2", commentID, userID)
	return err
}

func (r *CommentRepository) GetByID(id int64) (*models.ResultComment, error) {
	c := &models.ResultComment{}
	err := r.db.QueryRow("SELECT id, result_id, user_id, content, created_at FROM result_comments WHERE id = $1", id).
		Scan(&c.ID, &c.ResultID, &c.UserID, &c.Content, &c.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return c, err
}
