package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type PaymentRepository struct {
	db *sql.DB
}

func NewPaymentRepository(db *sql.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Create(payment *models.Payment) error {
	query := `
		INSERT INTO payments (user_id, plan_id, amount, currency, status, payment_method, external_id, proof_image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(
		query,
		payment.UserID,
		payment.PlanID,
		payment.Amount,
		payment.Currency,
		payment.Status,
		payment.PaymentMethod,
		payment.ExternalID,
		payment.ProofImageURL,
	).Scan(&payment.ID, &payment.CreatedAt, &payment.UpdatedAt)
}

func (r *PaymentRepository) GetByID(id int64) (*models.Payment, error) {
	payment := &models.Payment{}
	query := `SELECT id, user_id, plan_id, amount, currency, status, payment_method, COALESCE(external_id,''), COALESCE(proof_image_url,''), created_at, updated_at
			  FROM payments WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&payment.ID,
		&payment.UserID,
		&payment.PlanID,
		&payment.Amount,
		&payment.Currency,
		&payment.Status,
		&payment.PaymentMethod,
		&payment.ExternalID,
		&payment.ProofImageURL,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return payment, nil
}

func (r *PaymentRepository) UpdateStatus(id int64, status models.PaymentStatus) error {
	query := `UPDATE payments SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, status, time.Now(), id)
	return err
}

func (r *PaymentRepository) ListByUser(userID int64, limit, offset int) ([]*models.PaymentWithDetails, error) {
	query := `
		SELECT p.id, p.user_id, p.plan_id, p.amount, p.currency, p.status, p.payment_method, COALESCE(p.external_id,''), COALESCE(p.proof_image_url,''), p.created_at, p.updated_at,
			   u.name, u.email, pl.name
		FROM payments p
		JOIN users u ON p.user_id = u.id
		JOIN plans pl ON p.plan_id = pl.id
		WHERE p.user_id = $1
		ORDER BY p.created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []*models.PaymentWithDetails
	for rows.Next() {
		p := &models.PaymentWithDetails{}
		err := rows.Scan(
			&p.ID, &p.UserID, &p.PlanID, &p.Amount, &p.Currency, &p.Status,
			&p.PaymentMethod, &p.ExternalID, &p.ProofImageURL, &p.CreatedAt, &p.UpdatedAt,
			&p.UserName, &p.UserEmail, &p.PlanName,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, p)
	}
	return payments, nil
}

func (r *PaymentRepository) ListAll(limit, offset int) ([]*models.PaymentWithDetails, error) {
	query := `
		SELECT p.id, p.user_id, p.plan_id, p.amount, p.currency, p.status, p.payment_method, COALESCE(p.external_id,''), COALESCE(p.proof_image_url,''), p.created_at, p.updated_at,
			   u.name, u.email, pl.name
		FROM payments p
		JOIN users u ON p.user_id = u.id
		JOIN plans pl ON p.plan_id = pl.id
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []*models.PaymentWithDetails
	for rows.Next() {
		p := &models.PaymentWithDetails{}
		err := rows.Scan(
			&p.ID, &p.UserID, &p.PlanID, &p.Amount, &p.Currency, &p.Status,
			&p.PaymentMethod, &p.ExternalID, &p.ProofImageURL, &p.CreatedAt, &p.UpdatedAt,
			&p.UserName, &p.UserEmail, &p.PlanName,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, p)
	}
	return payments, nil
}

// Subscriptions

func (r *PaymentRepository) CreateSubscription(sub *models.Subscription) error {
	query := `
		INSERT INTO subscriptions (user_id, plan_id, payment_id, start_date, end_date, classes_used, classes_allowed, active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at`

	return r.db.QueryRow(
		query,
		sub.UserID,
		sub.PlanID,
		sub.PaymentID,
		sub.StartDate,
		sub.EndDate,
		sub.ClassesUsed,
		sub.ClassesAllowed,
		sub.Active,
	).Scan(&sub.ID, &sub.CreatedAt)
}

func (r *PaymentRepository) GetActiveSubscription(userID int64) (*models.SubscriptionWithPlan, error) {
	sub := &models.SubscriptionWithPlan{}
	// Incluye periodo de gracia: bloqueo desde día 6. end_date + 5 días >= hoy => puede reservar
	query := `
		SELECT s.id, s.user_id, s.plan_id, s.payment_id, s.start_date, s.end_date,
			   s.classes_used, s.classes_allowed, s.active,
			   COALESCE(s.frozen, false), s.frozen_until,
			   s.created_at, p.name, p.price
		FROM subscriptions s
		JOIN plans p ON s.plan_id = p.id
		WHERE s.user_id = $1 AND s.active = true
		  AND s.end_date >= CURRENT_DATE - INTERVAL '5 days'
		ORDER BY s.end_date DESC
		LIMIT 1`

	err := r.db.QueryRow(query, userID).Scan(
		&sub.ID, &sub.UserID, &sub.PlanID, &sub.PaymentID, &sub.StartDate, &sub.EndDate,
		&sub.ClassesUsed, &sub.ClassesAllowed, &sub.Active,
		&sub.Frozen, &sub.FrozenUntil,
		&sub.CreatedAt, &sub.PlanName, &sub.PlanPrice,
	)
	if err != nil {
		return nil, err
	}
	return sub, nil
}

func (r *PaymentRepository) FreezeSubscription(userID int64, frozenUntil time.Time) error {
	// Extend end_date by freeze duration and mark as frozen
	query := `
		UPDATE subscriptions
		SET frozen = true,
		    frozen_until = $2,
		    end_date = end_date + ($2::date - CURRENT_DATE) * INTERVAL '1 day'
		WHERE user_id = $1 AND active = true
		  AND end_date >= CURRENT_DATE - INTERVAL '5 days'`
	_, err := r.db.Exec(query, userID, frozenUntil)
	return err
}

func (r *PaymentRepository) UnfreezeSubscription(userID int64) error {
	// Remove remaining freeze days from end_date and unfreeze
	query := `
		UPDATE subscriptions
		SET frozen = false,
		    end_date = CASE
		        WHEN frozen_until > CURRENT_DATE
		        THEN end_date - (frozen_until::date - CURRENT_DATE) * INTERVAL '1 day'
		        ELSE end_date
		    END,
		    frozen_until = NULL
		WHERE user_id = $1 AND active = true AND frozen = true`
	_, err := r.db.Exec(query, userID)
	return err
}

func (r *PaymentRepository) IncrementClassesUsed(subscriptionID int64) error {
	query := `UPDATE subscriptions SET classes_used = classes_used + 1 WHERE id = $1`
	_, err := r.db.Exec(query, subscriptionID)
	return err
}

func (r *PaymentRepository) DecrementClassesUsed(subscriptionID int64) error {
	query := `UPDATE subscriptions SET classes_used = GREATEST(classes_used - 1, 0) WHERE id = $1`
	_, err := r.db.Exec(query, subscriptionID)
	return err
}

func (r *PaymentRepository) DeactivateExpiredSubscriptions() error {
	query := `UPDATE subscriptions SET active = false WHERE end_date < NOW() AND active = true`
	_, err := r.db.Exec(query)
	return err
}
