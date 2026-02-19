package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type StatsRepository struct {
	db *sql.DB
}

func NewStatsRepository(db *sql.DB) *StatsRepository {
	return &StatsRepository{db: db}
}

func (r *StatsRepository) GetDashboard() (*models.DashboardStats, error) {
	stats := &models.DashboardStats{}

	// Users
	r.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'user'").Scan(&stats.TotalUsers)
	r.db.QueryRow(`SELECT COUNT(DISTINCT s.user_id) FROM subscriptions s WHERE s.active = true AND s.end_date > NOW()`).Scan(&stats.ActiveUsers)
	stats.InactiveUsers = stats.TotalUsers - stats.ActiveUsers
	r.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)").Scan(&stats.NewUsersMonth)

	// Revenue
	r.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'").Scan(&stats.TotalRevenue)
	r.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)").Scan(&stats.RevenueMonth)

	// Subscriptions
	r.db.QueryRow("SELECT COUNT(*) FROM subscriptions WHERE active = true AND end_date > NOW()").Scan(&stats.ActiveSubs)

	// Today
	r.db.QueryRow("SELECT COUNT(*) FROM class_schedules WHERE date = CURRENT_DATE AND cancelled = false").Scan(&stats.ClassesToday)
	r.db.QueryRow(`SELECT COUNT(*) FROM bookings b JOIN class_schedules cs ON b.class_schedule_id = cs.id WHERE cs.date = CURRENT_DATE AND b.status IN ('booked', 'attended')`).Scan(&stats.BookingsToday)
	r.db.QueryRow(`SELECT COUNT(*) FROM bookings b JOIN class_schedules cs ON b.class_schedule_id = cs.id WHERE cs.date = CURRENT_DATE AND b.status = 'attended'`).Scan(&stats.AttendanceToday)

	return stats, nil
}

func (r *StatsRepository) GetAttendanceStats(from, to time.Time) ([]*models.AttendanceStats, error) {
	query := `
		SELECT
			cs.date::text,
			SUM(cs.capacity) as total_slots,
			SUM(cs.booked) as booked,
			COUNT(CASE WHEN b.status = 'attended' THEN 1 END) as attended,
			COUNT(CASE WHEN b.status = 'no_show' THEN 1 END) as no_show
		FROM class_schedules cs
		LEFT JOIN bookings b ON cs.id = b.class_schedule_id
		WHERE cs.date >= $1 AND cs.date <= $2 AND cs.cancelled = false
		GROUP BY cs.date
		ORDER BY cs.date`

	rows, err := r.db.Query(query, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []*models.AttendanceStats
	for rows.Next() {
		s := &models.AttendanceStats{}
		if err := rows.Scan(&s.Date, &s.TotalSlots, &s.Booked, &s.Attended, &s.NoShow); err != nil {
			return nil, err
		}
		if s.Booked > 0 {
			s.Rate = float64(s.Attended) / float64(s.Booked) * 100
		}
		stats = append(stats, s)
	}
	return stats, nil
}

func (r *StatsRepository) GetRevenueStats(period string) ([]*models.RevenueStats, error) {
	var query string
	switch period {
	case "daily":
		query = `SELECT DATE(created_at)::text, COALESCE(SUM(amount), 0), COUNT(*), currency
				 FROM payments WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
				 GROUP BY DATE(created_at), currency ORDER BY DATE(created_at)`
	case "weekly":
		query = `SELECT DATE_TRUNC('week', created_at)::date::text, COALESCE(SUM(amount), 0), COUNT(*), currency
				 FROM payments WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '12 weeks'
				 GROUP BY DATE_TRUNC('week', created_at), currency ORDER BY DATE_TRUNC('week', created_at)`
	default: // monthly
		query = `SELECT TO_CHAR(created_at, 'YYYY-MM'), COALESCE(SUM(amount), 0), COUNT(*), currency
				 FROM payments WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '12 months'
				 GROUP BY TO_CHAR(created_at, 'YYYY-MM'), currency ORDER BY TO_CHAR(created_at, 'YYYY-MM')`
	}

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []*models.RevenueStats
	for rows.Next() {
		s := &models.RevenueStats{}
		if err := rows.Scan(&s.Period, &s.Amount, &s.Count, &s.Currency); err != nil {
			return nil, err
		}
		stats = append(stats, s)
	}
	return stats, nil
}

func (r *StatsRepository) GetPlanStats() ([]*models.PlanStats, error) {
	query := `
		SELECT
			p.id, p.name,
			COUNT(DISTINCT CASE WHEN s.active = true AND s.end_date > NOW() THEN s.id END) as active_subs,
			COUNT(DISTINCT pay.id) as total_sales,
			COALESCE(SUM(CASE WHEN pay.status = 'completed' THEN pay.amount END), 0) as revenue
		FROM plans p
		LEFT JOIN subscriptions s ON p.id = s.plan_id
		LEFT JOIN payments pay ON p.id = pay.plan_id
		GROUP BY p.id, p.name
		ORDER BY revenue DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []*models.PlanStats
	for rows.Next() {
		s := &models.PlanStats{}
		if err := rows.Scan(&s.PlanID, &s.PlanName, &s.ActiveSubs, &s.TotalSales, &s.Revenue); err != nil {
			return nil, err
		}
		stats = append(stats, s)
	}
	return stats, nil
}

func (r *StatsRepository) GetUserActivity(status string, limit int) ([]*models.UserActivityStats, error) {
	query := `
		SELECT
			u.id, u.name, u.email,
			MAX(b.checked_in_at) as last_activity,
			COUNT(DISTINCT CASE WHEN b.status = 'attended' THEN b.id END) as total_classes,
			CASE
				WHEN u.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 'new'
				WHEN EXISTS(SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.active = true AND s.end_date > NOW()) THEN 'active'
				ELSE 'inactive'
			END as status
		FROM users u
		LEFT JOIN bookings b ON u.id = b.user_id
		WHERE u.role = 'user'`

	if status != "" {
		switch status {
		case "active":
			query += " AND EXISTS(SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.active = true AND s.end_date > NOW())"
		case "inactive":
			query += " AND NOT EXISTS(SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.active = true AND s.end_date > NOW())"
		case "new":
			query += " AND u.created_at >= CURRENT_DATE - INTERVAL '30 days'"
		}
	}

	query += " GROUP BY u.id, u.name, u.email, u.created_at ORDER BY last_activity DESC NULLS LAST LIMIT $1"

	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []*models.UserActivityStats
	for rows.Next() {
		s := &models.UserActivityStats{}
		if err := rows.Scan(&s.UserID, &s.UserName, &s.UserEmail, &s.LastActivity, &s.TotalClasses, &s.Status); err != nil {
			return nil, err
		}
		stats = append(stats, s)
	}
	return stats, nil
}

func (r *StatsRepository) GetClassPopularity(limit int) ([]*models.ClassPopularity, error) {
	query := `
		SELECT
			c.id, c.name, d.name,
			COUNT(b.id) as total_bookings,
			AVG(CASE WHEN b.status = 'attended' THEN 1 ELSE 0 END) * 100 as avg_attendance,
			AVG(cs.booked::float / NULLIF(cs.capacity, 0)) * 100 as fill_rate
		FROM classes c
		JOIN disciplines d ON c.discipline_id = d.id
		LEFT JOIN class_schedules cs ON c.id = cs.class_id
		LEFT JOIN bookings b ON cs.id = b.class_schedule_id
		WHERE c.active = true
		GROUP BY c.id, c.name, d.name
		ORDER BY total_bookings DESC
		LIMIT $1`

	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []*models.ClassPopularity
	for rows.Next() {
		s := &models.ClassPopularity{}
		var avgAtt, fillRate sql.NullFloat64
		if err := rows.Scan(&s.ClassID, &s.ClassName, &s.DisciplineName, &s.TotalBookings, &avgAtt, &fillRate); err != nil {
			return nil, err
		}
		s.AvgAttendance = avgAtt.Float64
		s.FillRate = fillRate.Float64
		stats = append(stats, s)
	}
	return stats, nil
}

func (r *StatsRepository) GetRetentionAlerts(inactiveDays, limit int) ([]*models.RetentionAlert, error) {
	query := `
		SELECT u.id, u.name, u.email, MAX(b.created_at) as last_booking,
		       COALESCE(EXTRACT(DAY FROM NOW() - MAX(b.created_at))::int, 9999) as days_inactive
		FROM users u
		LEFT JOIN bookings b ON u.id = b.user_id AND b.status IN ('booked', 'attended')
		WHERE u.role = 'user' AND u.active = true
		GROUP BY u.id, u.name, u.email
		HAVING COALESCE(EXTRACT(DAY FROM NOW() - MAX(b.created_at))::int, 9999) >= $1
		ORDER BY days_inactive DESC
		LIMIT $2`

	rows, err := r.db.Query(query, inactiveDays, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []*models.RetentionAlert
	for rows.Next() {
		a := &models.RetentionAlert{}
		if err := rows.Scan(&a.UserID, &a.UserName, &a.UserEmail, &a.LastBooking, &a.DaysInactive); err != nil {
			return nil, err
		}
		alerts = append(alerts, a)
	}
	return alerts, nil
}

func (r *StatsRepository) GetMonthlyReport(month string) (*models.MonthlyReport, error) {
	report := &models.MonthlyReport{Month: month}

	// Parse month
	startDate, err := time.Parse("2006-01", month)
	if err != nil {
		startDate = time.Now().Truncate(24 * time.Hour)
		startDate = time.Date(startDate.Year(), startDate.Month(), 1, 0, 0, 0, 0, startDate.Location())
	}
	endDate := startDate.AddDate(0, 1, 0)

	r.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= $1 AND created_at < $2", startDate, endDate).Scan(&report.NewUsers)
	r.db.QueryRow(`SELECT COUNT(DISTINCT s.user_id) FROM subscriptions s WHERE s.active = true AND s.start_date < $2 AND s.end_date > $1`, startDate, endDate).Scan(&report.ActiveUsers)
	r.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= $1 AND created_at < $2", startDate, endDate).Scan(&report.TotalRevenue)
	r.db.QueryRow("SELECT COUNT(*) FROM class_schedules WHERE date >= $1 AND date < $2", startDate, endDate).Scan(&report.TotalClasses)
	r.db.QueryRow(`SELECT COUNT(*) FROM bookings b JOIN class_schedules cs ON b.class_schedule_id = cs.id WHERE cs.date >= $1 AND cs.date < $2 AND b.status = 'attended'`, startDate, endDate).Scan(&report.TotalAttendance)

	report.TopPlans, _ = r.GetPlanStats()
	report.TopClasses, _ = r.GetClassPopularity(5)

	return report, nil
}
