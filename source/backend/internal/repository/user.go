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
		INSERT INTO users (email, password_hash, name, phone, avatar_url, role, active, invitation_classes, birth_date, sex, weight_kg, height_cm)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		user.Email,
		user.PasswordHash,
		user.Name,
		user.Phone,
		user.AvatarURL,
		user.Role,
		user.Active,
		user.InvitationClasses,
		user.BirthDate,
		user.Sex,
		user.WeightKg,
		user.HeightCm,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `SELECT id, email, password_hash, name, phone, COALESCE(avatar_url,''), role, active, invitation_classes, birth_date, COALESCE(sex,''), COALESCE(weight_kg,0), COALESCE(height_cm,0), created_at, updated_at
			  FROM users WHERE email = $1`

	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Phone,
		&user.AvatarURL,
		&user.Role,
		&user.Active,
		&user.InvitationClasses,
		&user.BirthDate,
		&user.Sex,
		&user.WeightKg,
		&user.HeightCm,
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
	query := `SELECT id, email, password_hash, name, phone, COALESCE(avatar_url,''), role, active, invitation_classes, birth_date, COALESCE(sex,''), COALESCE(weight_kg,0), COALESCE(height_cm,0), created_at, updated_at
			  FROM users WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.Phone,
		&user.AvatarURL,
		&user.Role,
		&user.Active,
		&user.InvitationClasses,
		&user.BirthDate,
		&user.Sex,
		&user.WeightKg,
		&user.HeightCm,
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
		SET name = $1, phone = $2, avatar_url = $3, role = $4, active = $5, invitation_classes = $6, updated_at = $7, birth_date = $8, sex = $9, weight_kg = $10, height_cm = $11
		WHERE id = $12`

	user.UpdatedAt = time.Now()
	_, err := r.db.Exec(query, user.Name, user.Phone, user.AvatarURL, user.Role, user.Active, user.InvitationClasses, user.UpdatedAt, user.BirthDate, user.Sex, user.WeightKg, user.HeightCm, user.ID)
	return err
}

func (r *UserRepository) Delete(id int64) error {
	_, err := r.db.Exec("DELETE FROM users WHERE id = $1", id)
	return err
}

func (r *UserRepository) DeleteByEmail(email string) error {
	_, err := r.db.Exec("DELETE FROM users WHERE email = $1", email)
	return err
}

func (r *UserRepository) List(limit, offset int) ([]*models.User, error) {
	query := `SELECT id, email, password_hash, name, phone, COALESCE(avatar_url,''), role, active, invitation_classes, birth_date, COALESCE(sex,''), COALESCE(weight_kg,0), COALESCE(height_cm,0), created_at, updated_at
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
			&user.AvatarURL,
			&user.Role,
			&user.Active,
			&user.InvitationClasses,
			&user.BirthDate,
			&user.Sex,
			&user.WeightKg,
			&user.HeightCm,
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

func (r *UserRepository) AddInvitationClasses(userID int64, count int) error {
	query := `UPDATE users SET invitation_classes = invitation_classes + $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(query, count, userID)
	return err
}

func (r *UserRepository) UseInvitationClass(userID int64) (bool, error) {
	result, err := r.db.Exec(
		`UPDATE users SET invitation_classes = invitation_classes - 1, updated_at = NOW()
		 WHERE id = $1 AND invitation_classes > 0`,
		userID,
	)
	if err != nil {
		return false, err
	}
	n, _ := result.RowsAffected()
	return n > 0, nil
}
