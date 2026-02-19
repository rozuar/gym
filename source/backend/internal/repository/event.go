package repository

import (
	"database/sql"

	"boxmagic/internal/models"
)

type EventRepository struct {
	db *sql.DB
}

func NewEventRepository(db *sql.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) List(userID int64, activeOnly bool) ([]*models.Event, error) {
	q := `SELECT e.id, e.title, COALESCE(e.description,''), COALESCE(e.event_type,'event'), e.date, e.capacity, e.price, COALESCE(e.currency,'CLP'), COALESCE(e.image_url,''), e.active, COALESCE(e.created_by,0), e.created_at,
		(SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id),
		(SELECT COUNT(*) > 0 FROM event_registrations er WHERE er.event_id = e.id AND er.user_id = $1)
		FROM events e WHERE 1=1`
	args := []interface{}{userID}
	if activeOnly {
		q += ` AND e.active = true`
	}
	q += ` ORDER BY e.date ASC`
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Event
	for rows.Next() {
		e := &models.Event{}
		if err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventType, &e.Date, &e.Capacity, &e.Price, &e.Currency, &e.ImageURL, &e.Active, &e.CreatedBy, &e.CreatedAt, &e.RegisteredCount, &e.IsRegistered); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

func (r *EventRepository) GetByID(id int64, userID int64) (*models.Event, error) {
	e := &models.Event{}
	err := r.db.QueryRow(`SELECT e.id, e.title, COALESCE(e.description,''), COALESCE(e.event_type,'event'), e.date, e.capacity, e.price, COALESCE(e.currency,'CLP'), COALESCE(e.image_url,''), e.active, COALESCE(e.created_by,0), e.created_at,
		(SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id),
		(SELECT COUNT(*) > 0 FROM event_registrations er WHERE er.event_id = e.id AND er.user_id = $2)
		FROM events e WHERE e.id = $1`, id, userID).
		Scan(&e.ID, &e.Title, &e.Description, &e.EventType, &e.Date, &e.Capacity, &e.Price, &e.Currency, &e.ImageURL, &e.Active, &e.CreatedBy, &e.CreatedAt, &e.RegisteredCount, &e.IsRegistered)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return e, err
}

func (r *EventRepository) Create(e *models.Event) error {
	return r.db.QueryRow(
		`INSERT INTO events (title, description, event_type, date, capacity, price, currency, image_url, active, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9) RETURNING id, created_at`,
		e.Title, e.Description, e.EventType, e.Date, e.Capacity, e.Price, e.Currency, e.ImageURL, e.CreatedBy,
	).Scan(&e.ID, &e.CreatedAt)
}

func (r *EventRepository) Update(e *models.Event) error {
	_, err := r.db.Exec(
		`UPDATE events SET title=$1, description=$2, event_type=$3, date=$4, capacity=$5, price=$6, currency=$7, image_url=$8, active=$9 WHERE id=$10`,
		e.Title, e.Description, e.EventType, e.Date, e.Capacity, e.Price, e.Currency, e.ImageURL, e.Active, e.ID,
	)
	return err
}

func (r *EventRepository) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM events WHERE id=$1`, id)
	return err
}

func (r *EventRepository) Register(eventID int64, userID int64) error {
	_, err := r.db.Exec(`INSERT INTO event_registrations (event_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, eventID, userID)
	return err
}

func (r *EventRepository) Unregister(eventID int64, userID int64) error {
	_, err := r.db.Exec(`DELETE FROM event_registrations WHERE event_id=$1 AND user_id=$2`, eventID, userID)
	return err
}

func (r *EventRepository) ListRegistrations(eventID int64) ([]*models.EventRegistration, error) {
	rows, err := r.db.Query(`SELECT er.id, er.event_id, er.user_id, er.status, er.paid, er.created_at, u.name, u.email
		FROM event_registrations er JOIN users u ON u.id = er.user_id WHERE er.event_id = $1 ORDER BY er.created_at ASC`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.EventRegistration
	for rows.Next() {
		reg := &models.EventRegistration{}
		if err := rows.Scan(&reg.ID, &reg.EventID, &reg.UserID, &reg.Status, &reg.Paid, &reg.CreatedAt, &reg.UserName, &reg.UserEmail); err != nil {
			return nil, err
		}
		list = append(list, reg)
	}
	return list, nil
}

func (r *EventRepository) UpdateRegistration(eventID int64, userID int64, paid bool) error {
	_, err := r.db.Exec(`UPDATE event_registrations SET paid=$1 WHERE event_id=$2 AND user_id=$3`, paid, eventID, userID)
	return err
}

func (r *EventRepository) MyEvents(userID int64) ([]*models.Event, error) {
	rows, err := r.db.Query(`SELECT e.id, e.title, COALESCE(e.description,''), COALESCE(e.event_type,'event'), e.date, e.capacity, e.price, COALESCE(e.currency,'CLP'), COALESCE(e.image_url,''), e.active, COALESCE(e.created_by,0), e.created_at,
		(SELECT COUNT(*) FROM event_registrations er2 WHERE er2.event_id = e.id), true
		FROM events e JOIN event_registrations er ON er.event_id = e.id WHERE er.user_id = $1 ORDER BY e.date ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Event
	for rows.Next() {
		e := &models.Event{}
		if err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventType, &e.Date, &e.Capacity, &e.Price, &e.Currency, &e.ImageURL, &e.Active, &e.CreatedBy, &e.CreatedAt, &e.RegisteredCount, &e.IsRegistered); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}
