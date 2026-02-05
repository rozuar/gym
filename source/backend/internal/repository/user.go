package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (email, password_hash, name, phone, role, active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		user.Email,
		user.PasswordHash,
		user.Name,
		user.Phone,
		user.Role,
		user.Active,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `SELECT id, email, password_hash, name, phone, role, active, created_at, updated_at
			  FROM users WHERE email = $1`

	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Phone,
		&user.Role,
		&user.Active,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) GetByID(id int64) (*models.User, error) {
	user := &models.User{}
	query := `SELECT id, email, password_hash, name, phone, role, active, created_at, updated_at
			  FROM users WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Phone,
		&user.Role,
		&user.Active,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) Update(user *models.User) error {
	query := `
		UPDATE users
		SET name = $1, phone = $2, role = $3, active = $4, updated_at = $5
		WHERE id = $6`

	user.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, user.Name, user.Phone, user.Role, user.Active, user.UpdatedAt, user.ID)
	return err
}

func (r *UserRepository) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM users WHERE id = $1", id)
	return err
}

func (r *UserRepository) List(limit, offset int) ([]*models.User, error) {
	query := `SELECT id, email, password_hash, name, phone, role, active, created_at, updated_at
			  FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.PasswordHash,
			&user.Name,
			&user.Phone,
			&user.Role,
			&user.Active,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *UserRepository) SaveRefreshToken(userID int64, token string, expiresAt time.Time) error {
	query := `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`
	_, err := r.db.Exec(query, userID, token, expiresAt)
	return err
}

func (r *UserRepository) GetRefreshToken(token string) (int64, error) {
	var userID int64
	query := `SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`
	err := r.db.QueryRow(query, token).Scan(&userID)
	return userID, err
}

func (r *UserRepository) DeleteRefreshToken(token string) error {
	_, err := r.db.Exec("DELETE FROM refresh_tokens WHERE token = $1", token)
	return err
}
