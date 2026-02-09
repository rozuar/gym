package repository

import (
	"database/sql"

	_ "github.com/lib/pq"
)

func NewDB(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}

func Migrate(db *sql.DB) error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		name VARCHAR(255) NOT NULL,
		phone VARCHAR(50),
		role VARCHAR(20) DEFAULT 'user',
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS refresh_tokens (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		token VARCHAR(255) UNIQUE NOT NULL,
		expires_at TIMESTAMP NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

	CREATE TABLE IF NOT EXISTS plans (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		price BIGINT NOT NULL,
		currency VARCHAR(10) DEFAULT 'CLP',
		duration INTEGER NOT NULL,
		max_classes INTEGER DEFAULT 0,
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS payments (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		plan_id INTEGER REFERENCES plans(id),
		amount BIGINT NOT NULL,
		currency VARCHAR(10) DEFAULT 'CLP',
		status VARCHAR(20) DEFAULT 'pending',
		payment_method VARCHAR(50),
		external_id VARCHAR(255),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS subscriptions (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		plan_id INTEGER REFERENCES plans(id),
		payment_id INTEGER REFERENCES payments(id),
		start_date TIMESTAMP NOT NULL,
		end_date TIMESTAMP NOT NULL,
		classes_used INTEGER DEFAULT 0,
		classes_allowed INTEGER DEFAULT 0,
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
	CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
	CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id, active);

	CREATE TABLE IF NOT EXISTS disciplines (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		color VARCHAR(20),
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS instructors (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255),
		phone VARCHAR(50),
		specialty VARCHAR(100),
		bio TEXT,
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS classes (
		id SERIAL PRIMARY KEY,
		discipline_id INTEGER REFERENCES disciplines(id),
		name VARCHAR(255) NOT NULL,
		description TEXT,
		day_of_week INTEGER NOT NULL,
		start_time VARCHAR(10) NOT NULL,
		end_time VARCHAR(10) NOT NULL,
		capacity INTEGER NOT NULL,
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS class_instructors (
		id SERIAL PRIMARY KEY,
		class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
		instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(class_id, instructor_id)
	);

	CREATE TABLE IF NOT EXISTS class_schedules (
		id SERIAL PRIMARY KEY,
		class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
		date DATE NOT NULL,
		capacity INTEGER NOT NULL,
		booked INTEGER DEFAULT 0,
		cancelled BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(class_id, date)
	);

	CREATE TABLE IF NOT EXISTS bookings (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		class_schedule_id INTEGER REFERENCES class_schedules(id) ON DELETE CASCADE,
		subscription_id INTEGER REFERENCES subscriptions(id),
		status VARCHAR(20) DEFAULT 'booked',
		checked_in_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, class_schedule_id)
	);

	CREATE INDEX IF NOT EXISTS idx_instructors_active ON instructors(active);
	CREATE INDEX IF NOT EXISTS idx_classes_discipline ON classes(discipline_id);
	CREATE INDEX IF NOT EXISTS idx_class_instructors_class ON class_instructors(class_id);
	CREATE INDEX IF NOT EXISTS idx_class_instructors_instructor ON class_instructors(instructor_id);
	CREATE INDEX IF NOT EXISTS idx_class_schedules_date ON class_schedules(date);
	CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
	CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON bookings(class_schedule_id);
	CREATE INDEX IF NOT EXISTS idx_routines_instructor ON routines(instructor_id);

	CREATE TABLE IF NOT EXISTS routines (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		type VARCHAR(50) DEFAULT 'wod',
		content TEXT NOT NULL,
		duration INTEGER,
		difficulty VARCHAR(50),
		instructor_id INTEGER REFERENCES instructors(id),
		created_by INTEGER REFERENCES users(id),
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS schedule_routines (
		id SERIAL PRIMARY KEY,
		class_schedule_id INTEGER REFERENCES class_schedules(id) ON DELETE CASCADE UNIQUE,
		routine_id INTEGER REFERENCES routines(id),
		notes TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS user_routine_results (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		routine_id INTEGER REFERENCES routines(id),
		class_schedule_id INTEGER REFERENCES class_schedules(id),
		score VARCHAR(100),
		notes TEXT,
		rx BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_routines_type ON routines(type);
	CREATE INDEX IF NOT EXISTS idx_user_results_user ON user_routine_results(user_id);
	CREATE INDEX IF NOT EXISTS idx_user_results_routine ON user_routine_results(routine_id);
	`

	_, err := db.Exec(query)
	return err
}
