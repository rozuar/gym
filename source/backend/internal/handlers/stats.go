package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type StatsHandler struct {
	statsRepo repository.StatsRepo
}

func NewStatsHandler(statsRepo repository.StatsRepo) *StatsHandler {
	return &StatsHandler{
		statsRepo: statsRepo,
	}
}

func (h *StatsHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	stats, err := h.statsRepo.GetDashboard()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch dashboard stats")
		return
	}
	respondJSON(w, http.StatusOK, stats)
}

func (h *StatsHandler) Attendance(w http.ResponseWriter, r *http.Request) {
	from := time.Now().AddDate(0, 0, -30).Truncate(24 * time.Hour)
	to := time.Now().Truncate(24 * time.Hour)

	if f := r.URL.Query().Get("from"); f != "" {
		if parsed, err := time.Parse("2006-01-02", f); err == nil {
			from = parsed
		}
	}
	if t := r.URL.Query().Get("to"); t != "" {
		if parsed, err := time.Parse("2006-01-02", t); err == nil {
			to = parsed
		}
	}

	stats, err := h.statsRepo.GetAttendanceStats(from, to)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch attendance stats")
		return
	}
	if stats == nil {
		stats = []*models.AttendanceStats{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"attendance": stats,
		"from":       from.Format("2006-01-02"),
		"to":         to.Format("2006-01-02"),
	})
}

func (h *StatsHandler) Revenue(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "monthly"
	}

	stats, err := h.statsRepo.GetRevenueStats(period)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch revenue stats")
		return
	}
	if stats == nil {
		stats = []*models.RevenueStats{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"revenue": stats,
		"period":  period,
	})
}

func (h *StatsHandler) Plans(w http.ResponseWriter, r *http.Request) {
	stats, err := h.statsRepo.GetPlanStats()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch plan stats")
		return
	}
	if stats == nil {
		stats = []*models.PlanStats{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"plans": stats})
}

func (h *StatsHandler) Users(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	limit := 100

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	stats, err := h.statsRepo.GetUserActivity(status, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch user stats")
		return
	}
	if stats == nil {
		stats = []*models.UserActivityStats{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"users":  stats,
		"status": status,
	})
}

func (h *StatsHandler) Classes(w http.ResponseWriter, r *http.Request) {
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	stats, err := h.statsRepo.GetClassPopularity(limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch class stats")
		return
	}
	if stats == nil {
		stats = []*models.ClassPopularity{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"classes": stats})
}

func (h *StatsHandler) MonthlyReport(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	report, err := h.statsRepo.GetMonthlyReport(month)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate report")
		return
	}

	respondJSON(w, http.StatusOK, report)
}

func (h *StatsHandler) Retention(w http.ResponseWriter, r *http.Request) {
	days := 30
	if d := r.URL.Query().Get("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			days = parsed
		}
	}
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}

	alerts, err := h.statsRepo.GetRetentionAlerts(days, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch retention data")
		return
	}
	if alerts == nil {
		alerts = []*models.RetentionAlert{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"alerts": alerts, "days": days})
}

func (h *StatsHandler) ExportUsers(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	stats, err := h.statsRepo.GetUserActivity(status, 10000)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=users_%s.csv", time.Now().Format("20060102")))

	writer := csv.NewWriter(w)
	writer.Write([]string{"ID", "Name", "Email", "Status", "Total Classes", "Last Activity"})

	for _, u := range stats {
		lastActivity := ""
		if u.LastActivity != nil {
			lastActivity = u.LastActivity.Format("2006-01-02 15:04")
		}
		writer.Write([]string{
			strconv.FormatInt(u.UserID, 10),
			u.UserName,
			u.UserEmail,
			u.Status,
			strconv.FormatInt(u.TotalClasses, 10),
			lastActivity,
		})
	}

	writer.Flush()
}

func (h *StatsHandler) ExportRevenue(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "monthly"
	}

	stats, err := h.statsRepo.GetRevenueStats(period)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch revenue")
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=revenue_%s_%s.csv", period, time.Now().Format("20060102")))

	writer := csv.NewWriter(w)
	writer.Write([]string{"Period", "Amount", "Transactions", "Currency"})

	for _, r := range stats {
		writer.Write([]string{
			r.Period,
			strconv.FormatInt(r.Amount, 10),
			strconv.FormatInt(r.Count, 10),
			r.Currency,
		})
	}

	writer.Flush()
}
