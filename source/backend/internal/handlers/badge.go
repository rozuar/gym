package handlers

import (
	"net/http"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type BadgeHandler struct {
	repo *repository.BadgeRepository
}

func NewBadgeHandler(repo *repository.BadgeRepository) *BadgeHandler {
	return &BadgeHandler{repo: repo}
}

func (h *BadgeHandler) MyBadges(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	badges, err := h.repo.GetUserBadges(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch badges")
		return
	}
	if badges == nil {
		badges = []*models.UserBadge{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"badges": badges})
}

// CheckAndAward evaluates all badge conditions for a user and awards any earned badges.
// Called asynchronously after booking checkin and result logging.
func CheckAndAward(badgeRepo *repository.BadgeRepository, userID int64) {
	// Class count badges
	checkins, err := badgeRepo.CountCheckins(userID)
	if err == nil {
		milestones := map[int]string{
			1:   models.BadgeFirstClass,
			10:  models.BadgeTenClasses,
			50:  models.BadgeFiftyClasses,
			100: models.BadgeHundredClass,
		}
		for threshold, badgeType := range milestones {
			if checkins >= threshold {
				_ = badgeRepo.AwardBadge(userID, badgeType)
			}
		}
	}

	// PR badges
	prs, err := badgeRepo.CountPRs(userID)
	if err == nil {
		if prs >= 1 {
			_ = badgeRepo.AwardBadge(userID, models.BadgeFirstPR)
		}
		if prs >= 10 {
			_ = badgeRepo.AwardBadge(userID, models.BadgeTenPRs)
		}
	}

	// Rx badge
	hasRx, err := badgeRepo.HasRxResult(userID)
	if err == nil && hasRx {
		_ = badgeRepo.AwardBadge(userID, models.BadgeFirstRx)
	}
}
