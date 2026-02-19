package models

import "time"

// Badge types
const (
	BadgeFirstClass    = "first_class"    // Primera reserva completada
	BadgeTenClasses    = "ten_classes"    // 10 clases asistidas
	BadgeFiftyClasses  = "fifty_classes"  // 50 clases asistidas
	BadgeHundredClass  = "hundred_classes" // 100 clases asistidas
	BadgeFirstPR       = "first_pr"       // Primer PR
	BadgeTenPRs        = "ten_prs"        // 10 PRs
	BadgeFirstRx       = "first_rx"       // Primer resultado Rx
	BadgeDedicated     = "dedicated"      // 30 días con suscripción activa
)

type BadgeInfo struct {
	Type        string `json:"type"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
}

var BadgeCatalog = map[string]BadgeInfo{
	BadgeFirstClass:   {Type: BadgeFirstClass, Name: "Primera clase", Description: "Completaste tu primera reserva", Icon: "🎯"},
	BadgeTenClasses:   {Type: BadgeTenClasses, Name: "10 clases", Description: "Has asistido a 10 clases", Icon: "💪"},
	BadgeFiftyClasses: {Type: BadgeFiftyClasses, Name: "50 clases", Description: "Has asistido a 50 clases", Icon: "🏋️"},
	BadgeHundredClass: {Type: BadgeHundredClass, Name: "100 clases", Description: "Has asistido a 100 clases", Icon: "🏆"},
	BadgeFirstPR:      {Type: BadgeFirstPR, Name: "Primer PR", Description: "Lograste tu primer record personal", Icon: "⭐"},
	BadgeTenPRs:       {Type: BadgeTenPRs, Name: "10 PRs", Description: "10 records personales. ¡Máquina!", Icon: "🔥"},
	BadgeFirstRx:      {Type: BadgeFirstRx, Name: "Rx", Description: "Completaste un WOD Rx por primera vez", Icon: "💎"},
	BadgeDedicated:    {Type: BadgeDedicated, Name: "Dedicado", Description: "Llevas más de 30 días como miembro activo", Icon: "🌟"},
}

type UserBadge struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	BadgeType string    `json:"badge_type"`
	AwardedAt time.Time `json:"awarded_at"`
	// Joined fields
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
}
