package models

import "time"

type DashboardStats struct {
	TotalUsers      int64 `json:"total_users"`
	ActiveUsers     int64 `json:"active_users"`
	InactiveUsers   int64 `json:"inactive_users"`
	NewUsersMonth   int64 `json:"new_users_month"`
	TotalRevenue    int64 `json:"total_revenue"`
	RevenueMonth    int64 `json:"revenue_month"`
	ActiveSubs      int64 `json:"active_subscriptions"`
	ClassesToday    int64 `json:"classes_today"`
	BookingsToday   int64 `json:"bookings_today"`
	AttendanceToday int64 `json:"attendance_today"`
}

type AttendanceStats struct {
	Date       string `json:"date"`
	TotalSlots int64  `json:"total_slots"`
	Booked     int64  `json:"booked"`
	Attended   int64  `json:"attended"`
	NoShow     int64  `json:"no_show"`
	Rate       float64 `json:"rate"`
}

type RevenueStats struct {
	Period   string `json:"period"`
	Amount   int64  `json:"amount"`
	Count    int64  `json:"count"`
	Currency string `json:"currency"`
}

type PlanStats struct {
	PlanID      int64  `json:"plan_id"`
	PlanName    string `json:"plan_name"`
	ActiveSubs  int64  `json:"active_subscriptions"`
	TotalSales  int64  `json:"total_sales"`
	Revenue     int64  `json:"revenue"`
}

type UserActivityStats struct {
	UserID       int64     `json:"user_id"`
	UserName     string    `json:"user_name"`
	UserEmail    string    `json:"user_email"`
	LastActivity *time.Time `json:"last_activity"`
	TotalClasses int64     `json:"total_classes"`
	Status       string    `json:"status"` // active, inactive, new
}

type ClassPopularity struct {
	ClassID        int64   `json:"class_id"`
	ClassName      string  `json:"class_name"`
	DisciplineName string  `json:"discipline_name"`
	TotalBookings  int64   `json:"total_bookings"`
	AvgAttendance  float64 `json:"avg_attendance"`
	FillRate       float64 `json:"fill_rate"`
}

type MonthlyReport struct {
	Month           string             `json:"month"`
	NewUsers        int64              `json:"new_users"`
	ActiveUsers     int64              `json:"active_users"`
	TotalRevenue    int64              `json:"total_revenue"`
	TotalClasses    int64              `json:"total_classes"`
	TotalAttendance int64              `json:"total_attendance"`
	TopPlans        []*PlanStats       `json:"top_plans"`
	TopClasses      []*ClassPopularity `json:"top_classes"`
}
