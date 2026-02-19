package handlers

import (
	"net/http"
	"time"

	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type TVHandler struct {
	classRepo   repository.ClassRepo
	routineRepo repository.RoutineRepo
}

func NewTVHandler(classRepo repository.ClassRepo, routineRepo repository.RoutineRepo) *TVHandler {
	return &TVHandler{classRepo: classRepo, routineRepo: routineRepo}
}

func (h *TVHandler) GetToday(w http.ResponseWriter, r *http.Request) {
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.AddDate(0, 0, 1)

	schedules, err := h.classRepo.ListSchedules(today, tomorrow)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch schedules")
		return
	}

	var tvSchedules []*models.TVSchedule
	for _, s := range schedules {
		if s.Cancelled {
			continue
		}
		tv := &models.TVSchedule{ScheduleWithDetails: *s}

		// Get routine info
		if sr, err := h.routineRepo.GetScheduleRoutine(s.ID); err == nil && sr != nil {
			tv.RoutineName = sr.RoutineName
			tv.RoutineType = sr.RoutineType
			tv.RoutineContent = sr.RoutineContent
			tv.RoutineContentScaled = sr.RoutineContentScaled
			tv.RoutineContentBeginner = sr.RoutineContentBeginner
		}

		// Get top 5 leaderboard
		if lb, err := h.routineRepo.GetLeaderboard(s.ID); err == nil && len(lb) > 0 {
			if len(lb) > 5 {
				lb = lb[:5]
			}
			tv.Leaderboard = lb
		}

		tvSchedules = append(tvSchedules, tv)
	}

	if tvSchedules == nil {
		tvSchedules = []*models.TVSchedule{}
	}

	respondJSON(w, http.StatusOK, &models.TVResponse{
		Date:      today.Format("2006-01-02"),
		Schedules: tvSchedules,
	})
}
