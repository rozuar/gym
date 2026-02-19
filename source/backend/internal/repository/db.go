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

	-- Migrations for existing databases
	-- Remove old instructor_id column from classes if it exists (was referencing users)
	DO $$
	BEGIN
		IF EXISTS (
			SELECT 1 FROM information_schema.columns 
			WHERE table_name = 'classes' AND column_name = 'instructor_id'
		) THEN
			-- Drop foreign key constraint if exists
			ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_instructor_id_fkey;
			-- Drop the column
			ALTER TABLE classes DROP COLUMN instructor_id;
		END IF;
	END $$;

	-- Add instructor_id to routines if it doesn't exist (references instructors table)
	DO $$
	BEGIN
		IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructors') THEN
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'routines' AND column_name = 'instructor_id'
			) THEN
				ALTER TABLE routines ADD COLUMN instructor_id INTEGER REFERENCES instructors(id);
			END IF;
		END IF;
	END $$;

	-- Create index on routines.instructor_id if column exists
	DO $$
	BEGIN
		IF EXISTS (
			SELECT 1 FROM information_schema.columns
			WHERE table_name = 'routines' AND column_name = 'instructor_id'
		) THEN
			CREATE INDEX IF NOT EXISTS idx_routines_instructor ON routines(instructor_id);
		END IF;
	END $$;

	-- Add billable, target_user_id, is_custom to routines
	ALTER TABLE routines ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT false;
	ALTER TABLE routines ADD COLUMN IF NOT EXISTS target_user_id INTEGER REFERENCES users(id);
	ALTER TABLE routines ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

	-- Payments: proof_image_url (transferencia)
	ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_image_url VARCHAR(500);

	-- Users: invitation_classes (1 clase invitación)
	ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_classes INTEGER DEFAULT 0;

	-- Bookings: subscription_id nullable para reservas por invitación
	ALTER TABLE bookings ALTER COLUMN subscription_id DROP NOT NULL;

	-- Users: avatar_url (foto de perfil)
	ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

	-- Bookings: before_photo_url (foto antes de clase, costo adicional)
	ALTER TABLE bookings ADD COLUMN IF NOT EXISTS before_photo_url VARCHAR(500);

	-- Users: profile fields
	ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
	ALTER TABLE users ADD COLUMN IF NOT EXISTS sex VARCHAR(10);
	ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);
	ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);

	-- Authorizations table
	CREATE TABLE IF NOT EXISTS authorizations (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		document_type VARCHAR(50) NOT NULL,
		signed_at TIMESTAMP NOT NULL,
		guardian_name VARCHAR(255),
		guardian_rut VARCHAR(20),
		notes TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_authorizations_user ON authorizations(user_id);

	-- Waitlist
	CREATE TABLE IF NOT EXISTS waitlist (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		class_schedule_id INTEGER REFERENCES class_schedules(id) ON DELETE CASCADE,
		position INTEGER NOT NULL,
		promoted_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, class_schedule_id)
	);
	CREATE INDEX IF NOT EXISTS idx_waitlist_schedule ON waitlist(class_schedule_id);
	CREATE INDEX IF NOT EXISTS idx_waitlist_user ON waitlist(user_id);

	-- Fistbumps (likes on results)
	CREATE TABLE IF NOT EXISTS fistbumps (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		result_id INTEGER REFERENCES user_routine_results(id) ON DELETE CASCADE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, result_id)
	);

	-- Feed events
	CREATE TABLE IF NOT EXISTS feed_events (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		event_type VARCHAR(50) NOT NULL,
		ref_id INTEGER,
		data_json TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_feed_events_date ON feed_events(created_at DESC);

	-- PR flag on results
	ALTER TABLE user_routine_results ADD COLUMN IF NOT EXISTS is_pr BOOLEAN DEFAULT false;

	-- Subscription freeze
	ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS frozen BOOLEAN DEFAULT false;
	ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMP;
	`

	_, err := db.Exec(query)
	return err
}
