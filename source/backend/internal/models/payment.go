package models

import (
	"time"
)

type PaymentStatus string

const (
	PaymentPending   PaymentStatus = "pending"
	PaymentCompleted PaymentStatus = "completed"
	PaymentFailed    PaymentStatus = "failed"
	PaymentRefunded  PaymentStatus = "refunded"
)

type Payment struct {
	ID            int64         `json:"id"`
	UserID        int64         `json:"user_id"`
	PlanID        int64         `json:"plan_id"`
	Amount        int64         `json:"amount"`
	Currency      string        `json:"currency"`
	Status        PaymentStatus `json:"status"`
	PaymentMethod string        `json:"payment_method,omitempty"`
	ExternalID    string        `json:"external_id,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

type Subscription struct {
	ID             int64     `json:"id"`
	UserID         int64     `json:"user_id"`
	PlanID         int64     `json:"plan_id"`
	PaymentID      int64     `json:"payment_id"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
	ClassesUsed    int       `json:"classes_used"`
	ClassesAllowed int       `json:"classes_allowed"`
	Active         bool      `json:"active"`
	CreatedAt      time.Time `json:"created_at"`
}

type CreatePaymentRequest struct {
	PlanID        int64  `json:"plan_id"`
	PaymentMethod string `json:"payment_method"`
}

type PaymentWithDetails struct {
	Payment
	UserName string `json:"user_name"`
	UserEmail string `json:"user_email"`
	PlanName string `json:"plan_name"`
}

type SubscriptionWithPlan struct {
	Subscription
	PlanName    string `json:"plan_name"`
	PlanPrice   int64  `json:"plan_price"`
}
