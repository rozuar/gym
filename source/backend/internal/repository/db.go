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

	-- Disciplines: color column
	ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS color VARCHAR(20);

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

	-- Discount codes
	CREATE TABLE IF NOT EXISTS discount_codes (
		id SERIAL PRIMARY KEY,
		code VARCHAR(50) UNIQUE NOT NULL,
		description VARCHAR(255),
		discount_type VARCHAR(20) NOT NULL DEFAULT 'percent',
		discount_value INTEGER NOT NULL,
		max_uses INTEGER DEFAULT 0,
		uses_count INTEGER DEFAULT 0,
		valid_until TIMESTAMP,
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);

	-- User badges
	CREATE TABLE IF NOT EXISTS user_badges (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		badge_type VARCHAR(50) NOT NULL,
		awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, badge_type)
	);
	CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

	-- Trial pricing on plans
	ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_price BIGINT DEFAULT 0;
	ALTER TABLE plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;

	-- Leads / Pipeline de ventas (6.1)
	CREATE TABLE IF NOT EXISTS leads (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255),
		phone VARCHAR(50),
		source VARCHAR(50) DEFAULT 'other',
		status VARCHAR(50) DEFAULT 'new',
		notes TEXT,
		assigned_to INTEGER REFERENCES users(id),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

	-- Body tracking / medidas corporales (9.1-9.3)
	CREATE TABLE IF NOT EXISTS body_measurements (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		weight_kg DECIMAL(5,2),
		body_fat_pct DECIMAL(4,1),
		chest_cm DECIMAL(5,1),
		waist_cm DECIMAL(5,1),
		hip_cm DECIMAL(5,1),
		arm_cm DECIMAL(5,1),
		thigh_cm DECIMAL(5,1),
		notes TEXT,
		photo_url VARCHAR(500),
		measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_body_measurements_user ON body_measurements(user_id);

	-- Comentarios en resultados (8.3)
	CREATE TABLE IF NOT EXISTS result_comments (
		id SERIAL PRIMARY KEY,
		result_id INTEGER REFERENCES user_routine_results(id) ON DELETE CASCADE,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		content TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_result_comments_result ON result_comments(result_id);

	-- On-ramp / Fundamentos (17.1-17.3)
	CREATE TABLE IF NOT EXISTS onramp_programs (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		required_sessions INTEGER DEFAULT 4,
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS onramp_enrollments (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		program_id INTEGER REFERENCES onramp_programs(id) ON DELETE CASCADE,
		sessions_completed INTEGER DEFAULT 0,
		completed_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, program_id)
	);
	CREATE INDEX IF NOT EXISTS idx_onramp_enrollments_user ON onramp_enrollments(user_id);

	-- Scaling options on routines (2.5)
	ALTER TABLE routines ADD COLUMN IF NOT EXISTS content_scaled TEXT;
	ALTER TABLE routines ADD COLUMN IF NOT EXISTS content_beginner TEXT;

	-- Challenges / retos (8.4)
	CREATE TABLE IF NOT EXISTS challenges (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		goal TEXT,
		type VARCHAR(50) DEFAULT 'custom',
		start_date DATE,
		end_date DATE,
		active BOOLEAN DEFAULT true,
		created_by INTEGER REFERENCES users(id),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(active);

	CREATE TABLE IF NOT EXISTS challenge_participants (
		id SERIAL PRIMARY KEY,
		challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		score VARCHAR(100),
		notes TEXT,
		completed_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(challenge_id, user_id)
	);
	CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
	CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);

	-- Movements / biblioteca (2.4)
	CREATE TABLE IF NOT EXISTS movements (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		category VARCHAR(100) DEFAULT 'other',
		video_url VARCHAR(500),
		muscles_primary VARCHAR(500),
		muscles_secondary VARCHAR(500),
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_movements_category ON movements(category);
	CREATE INDEX IF NOT EXISTS idx_movements_name ON movements(name);

	-- Events / competencias (16.1-16.4)
	CREATE TABLE IF NOT EXISTS events (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		description TEXT,
		event_type VARCHAR(50) DEFAULT 'event',
		date TIMESTAMP NOT NULL,
		capacity INTEGER DEFAULT 0,
		price INTEGER DEFAULT 0,
		currency VARCHAR(10) DEFAULT 'CLP',
		image_url VARCHAR(500),
		active BOOLEAN DEFAULT true,
		created_by INTEGER REFERENCES users(id),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS event_registrations (
		id SERIAL PRIMARY KEY,
		event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		status VARCHAR(50) DEFAULT 'registered',
		paid BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(event_id, user_id)
	);
	CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
	CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);

	-- Products / Retail POS (5.6)
	CREATE TABLE IF NOT EXISTS products (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		category VARCHAR(100) DEFAULT 'other',
		price INTEGER NOT NULL DEFAULT 0,
		stock INTEGER DEFAULT -1,
		image_url VARCHAR(500),
		active BOOLEAN DEFAULT true,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS sales (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id),
		total INTEGER NOT NULL,
		payment_method VARCHAR(50) DEFAULT 'cash',
		notes TEXT,
		created_by INTEGER REFERENCES users(id),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS sale_items (
		id SERIAL PRIMARY KEY,
		sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
		product_id INTEGER REFERENCES products(id),
		product_name VARCHAR(255) NOT NULL,
		quantity INTEGER NOT NULL DEFAULT 1,
		unit_price INTEGER NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
	CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

	-- Member tags (6.8)
	CREATE TABLE IF NOT EXISTS tags (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL UNIQUE,
		color VARCHAR(20) DEFAULT '#3b82f6'
	);
	CREATE TABLE IF NOT EXISTS user_tags (
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
		PRIMARY KEY (user_id, tag_id)
	);

	-- Nutrition tracking (9.4-9.7)
	CREATE TABLE IF NOT EXISTS nutrition_logs (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		food_name VARCHAR(255) NOT NULL,
		grams DECIMAL(6,1),
		calories DECIMAL(6,1),
		protein_g DECIMAL(5,1),
		carbs_g DECIMAL(5,1),
		fat_g DECIMAL(5,1),
		meal_type VARCHAR(50) DEFAULT 'other',
		logged_at DATE DEFAULT CURRENT_DATE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, logged_at);
	CREATE TABLE IF NOT EXISTS water_logs (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		ml INTEGER NOT NULL,
		logged_at DATE DEFAULT CURRENT_DATE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, logged_at);
	`

	_, err := db.Exec(query)
	return err
}
