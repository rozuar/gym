package repository

import (
	"database/sql"
	"time"

	"boxmagic/internal/models"
)

type UserRepo interface {
	Create(user *models.User) error
	GetByEmail(email string) (*models.User, error)
	GetByID(id int64) (*models.User, error)
	Update(user *models.User) error
	Delete(id int64) error
	List(limit, offset int) ([]*models.User, error)
	SaveRefreshToken(userID int64, token string, expiresAt time.Time) error
	GetRefreshToken(token string) (int64, error)
	DeleteRefreshToken(token string) error
	AddInvitationClasses(userID int64, count int) error
	UseInvitationClass(userID int64) (bool, error)
}

type PlanRepo interface {
	Create(plan *models.Plan) error
	GetByID(id int64) (*models.Plan, error)
	List(activeOnly bool) ([]*models.Plan, error)
	Update(plan *models.Plan) error
	Delete(id int64) error
}

type PaymentRepo interface {
	Create(payment *models.Payment) error
	GetByID(id int64) (*models.Payment, error)
	UpdateStatus(id int64, status models.PaymentStatus) error
	ListByUser(userID int64, limit, offset int) ([]*models.PaymentWithDetails, error)
	ListAll(limit, offset int) ([]*models.PaymentWithDetails, error)
	CreateSubscription(sub *models.Subscription) error
	GetActiveSubscription(userID int64) (*models.SubscriptionWithPlan, error)
	IncrementClassesUsed(subscriptionID int64) error
	DecrementClassesUsed(subscriptionID int64) error
	DeactivateExpiredSubscriptions() error
	FreezeSubscription(userID int64, frozenUntil time.Time) error
	UnfreezeSubscription(userID int64) error
}

type InstructorRepo interface {
	Create(instructor *models.Instructor) error
	GetByID(id int64) (*models.Instructor, error)
	List(activeOnly bool) ([]*models.Instructor, error)
	Update(instructor *models.Instructor) error
	Delete(id int64) error
	AssignToClass(classID int64, instructorIDs []int64) error
	GetClassInstructors(classID int64) ([]*models.Instructor, error)
}

type ClassRepo interface {
	GetDB() *sql.DB
	CreateDiscipline(d *models.Discipline) error
	UpdateDiscipline(d *models.Discipline) error
	DeleteDiscipline(id int64) error
	ListDisciplines(activeOnly bool) ([]*models.Discipline, error)
	CreateClass(c *models.Class) error
	GetClassByID(id int64) (*models.ClassWithDetails, error)
	ListClasses(disciplineID int64, activeOnly bool) ([]*models.ClassWithDetails, error)
	UpdateClass(c *models.Class) error
	DeleteClass(id int64) error
	CreateSchedule(s *models.ClassSchedule) error
	GetScheduleByID(id int64) (*models.ScheduleWithDetails, error)
	ListSchedules(from, to time.Time) ([]*models.ScheduleWithDetails, error)
	GenerateWeekSchedules(startDate time.Time) error
	CreateBooking(b *models.Booking) error
	CreateBookingTx(b *models.Booking, credit *BookingCreditAction) error
	CancelBooking(bookingID, userID int64) (*int64, error)
	CheckIn(bookingID int64) error
	SetBookingBeforePhoto(bookingID, userID int64, photoURL string) error
	ListUserBookings(userID int64, upcoming bool) ([]*models.BookingWithDetails, error)
	CancelSchedule(scheduleID int64) ([]*models.BookingWithUser, error)
	GetScheduleBookings(scheduleID int64) ([]*models.BookingWithUser, error)
	JoinWaitlist(userID, scheduleID int64) (*models.WaitlistEntry, error)
	LeaveWaitlist(userID, scheduleID int64) error
	GetWaitlist(scheduleID int64) ([]*models.WaitlistEntryWithUser, error)
	PromoteFromWaitlist(tx *sql.Tx, scheduleID int64) (*models.WaitlistEntry, error)
}

type RoutineRepo interface {
	Create(routine *models.Routine) error
	GetByID(id int64) (*models.RoutineWithCreator, error)
	List(routineType string, custom *bool, limit, offset int) ([]*models.RoutineWithCreator, error)
	ListCustom(targetUserID *int64) ([]*models.RoutineWithCreator, error)
	Update(routine *models.Routine) error
	Delete(id int64) error
	AssignToSchedule(sr *models.ScheduleRoutine) error
	GetScheduleRoutine(scheduleID int64) (*models.ScheduleRoutineWithDetails, error)
	RemoveScheduleRoutine(scheduleID int64) error
	LogResult(result *models.UserRoutineResult) error
	GetUserResults(userID int64, limit int, offset ...int) ([]*models.UserResultWithDetails, error)
	GetRoutineHistory(routineID int64, userID int64) ([]*models.UserRoutineResult, error)
	GetResultByID(resultID int64) (*models.UserRoutineResult, error)
	UpdateResult(resultID int64, userID int64, score string, notes string, rx bool) error
	DeleteResult(resultID int64, userID int64) error
	GetUserPRs(userID int64) ([]*models.UserResultWithDetails, error)
	GetLeaderboard(scheduleID int64) ([]*models.LeaderboardEntry, error)
}

type DiscountCodeRepo interface {
	Create(code *models.DiscountCode) error
	GetByCode(code string) (*models.DiscountCode, error)
	List(activeOnly bool) ([]*models.DiscountCode, error)
	Delete(id int64) error
	IncrementUses(id int64) error
}

type BadgeRepo interface {
	AwardBadge(userID int64, badgeType string) error
	GetUserBadges(userID int64) ([]*models.UserBadge, error)
	HasBadge(userID int64, badgeType string) (bool, error)
	CountCheckins(userID int64) (int, error)
	CountPRs(userID int64) (int, error)
	HasRxResult(userID int64) (bool, error)
}

type FeedRepo interface {
	CreateEvent(event *models.FeedEvent) error
	GetFeed(limit, offset int) ([]*models.FeedEventWithUser, error)
	CreateFistbump(userID, resultID int64) (*models.Fistbump, error)
	DeleteFistbump(userID, resultID int64) error
}

type StatsRepo interface {
	GetDashboard() (*models.DashboardStats, error)
	GetAttendanceStats(from, to time.Time) ([]*models.AttendanceStats, error)
	GetRevenueStats(period string) ([]*models.RevenueStats, error)
	GetPlanStats() ([]*models.PlanStats, error)
	GetUserActivity(status string, limit int) ([]*models.UserActivityStats, error)
	GetClassPopularity(limit int) ([]*models.ClassPopularity, error)
	GetMonthlyReport(month string) (*models.MonthlyReport, error)
	GetRetentionAlerts(inactiveDays, limit int) ([]*models.RetentionAlert, error)
}
