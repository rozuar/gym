-- Seeder completo: todos los datos en un solo archivo
-- Idempotente: puede ejecutarse múltiples veces sin duplicar datos
-- Útil para ejecutar directamente sin usar \i

-- ============================================
-- 1. USUARIOS
-- ============================================
-- Nota: Los hashes de contraseña deben generarse con bcrypt
-- Para generar: go run scripts/seeders/generate_password_hash.go

-- Hash de "admin123": $2a$10$a9iqK3E0/JSFJ3Lbvq9s0u4TL0GEt77wsWKWFa9UgS4Rgx4t4EbCi
-- Hash de "user123": $2a$10$y.dvXk3zhnZZg7ZOdvQbgemXTI67pxZOlycnl/92v/1RZUdV4JwOS

INSERT INTO users (email, password_hash, name, phone, role, active)
VALUES (
    'admin@boxmagic.cl',
    '$2a$10$a9iqK3E0/JSFJ3Lbvq9s0u4TL0GEt77wsWKWFa9UgS4Rgx4t4EbCi', -- admin123
    'Administrador',
    '',
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, phone, role, active)
VALUES (
    'user@boxmagic.cl',
    '$2a$10$y.dvXk3zhnZZg7ZOdvQbgemXTI67pxZOlycnl/92v/1RZUdV4JwOS', -- user123
    'Usuario Demo',
    '',
    'user',
    true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. DISCIPLINAS
-- ============================================
INSERT INTO disciplines (name, description, color, active)
SELECT 'CrossFit', 'Entrenamiento funcional de alta intensidad', '#FF6B35', true
WHERE NOT EXISTS (SELECT 1 FROM disciplines WHERE name = 'CrossFit');

INSERT INTO disciplines (name, description, color, active)
SELECT 'Halterofilia', 'Levantamiento olímpico de pesas', '#4ECDC4', true
WHERE NOT EXISTS (SELECT 1 FROM disciplines WHERE name = 'Halterofilia');

INSERT INTO disciplines (name, description, color, active)
SELECT 'Gimnasia', 'Gimnasia deportiva y calistenia', '#45B7D1', true
WHERE NOT EXISTS (SELECT 1 FROM disciplines WHERE name = 'Gimnasia');

-- ============================================
-- 3. PLANES
-- ============================================
INSERT INTO plans (name, description, price, currency, duration, max_classes, active)
SELECT 'Plan Mensual', 'Acceso ilimitado por 30 dias', 45000, 'CLP', 30, 0, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plan Mensual');

INSERT INTO plans (name, description, price, currency, duration, max_classes, active)
SELECT 'Plan 12 Clases', '12 clases en 30 dias', 35000, 'CLP', 30, 12, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plan 12 Clases');

INSERT INTO plans (name, description, price, currency, duration, max_classes, active)
SELECT 'Plan 8 Clases', '8 clases en 30 dias', 28000, 'CLP', 30, 8, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plan 8 Clases');

-- ============================================
-- 4. INSTRUCTORES
-- ============================================
INSERT INTO instructors (name, email, phone, specialty, bio, active)
SELECT 'Juan Pérez', 'juan@boxmagic.cl', '+56912345678', 'CrossFit', 'Instructor certificado CrossFit Level 1', true
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE name = 'Juan Pérez');

INSERT INTO instructors (name, email, phone, specialty, bio, active)
SELECT 'María González', 'maria@boxmagic.cl', '+56987654321', 'Halterofilia', 'Especialista en levantamiento olímpico', true
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE name = 'María González');

INSERT INTO instructors (name, email, phone, specialty, bio, active)
SELECT 'Carlos Rodríguez', 'carlos@boxmagic.cl', '+56911223344', 'Gimnasia', 'Experto en gimnasia y calistenia', true
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE name = 'Carlos Rodríguez');

-- ============================================
-- 5. RUTINAS
-- ============================================
DO $$
DECLARE
    admin_id INTEGER;
BEGIN
    -- Obtener ID de admin
    SELECT id INTO admin_id FROM users WHERE email = 'admin@boxmagic.cl' LIMIT 1;
    
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;
    END IF;
    
    -- Si no hay admin, mostrar advertencia pero continuar
    IF admin_id IS NULL THEN
        RAISE NOTICE 'Advertencia: No se encontró usuario admin. Las rutinas se crearán sin created_by.';
    END IF;
    
    -- Insertar rutinas individualmente para evitar errores si alguna ya existe
    INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
    SELECT 'Fran', '21-15-9', 'wod', 'Thruster 43kg, Pull-ups', 10, 'rx', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM routines WHERE name = 'Fran');
    
    INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
    SELECT 'Cindy', 'AMRAP 20 min', 'wod', '5 Pull-ups, 10 Push-ups, 15 Air Squats', 20, 'intermediate', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM routines WHERE name = 'Cindy');
    
    INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
    SELECT 'Helen', '3 rondas', 'wod', '400m run, 21 KB swing 24kg, 12 Pull-ups', 12, 'intermediate', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM routines WHERE name = 'Helen');
    
    INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
    SELECT 'Grace', 'For time', 'wod', '30 Clean & Jerk 43kg', 5, 'rx', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM routines WHERE name = 'Grace');
    
    INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
    SELECT 'Murph', 'For time', 'wod', '1 mile run, 100 Pull-ups, 200 Push-ups, 300 Air Squats, 1 mile run', 45, 'rx', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM routines WHERE name = 'Murph');
    
    INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
    SELECT 'Fuerza A', 'Back Squat', 'strength', '5x5 Back Squat @ 80%', 45, 'intermediate', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM routines WHERE name = 'Fuerza A');
    
    INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
    SELECT 'Skill Work', 'Muscle-up Progression', 'skill', '3 rounds: 5 strict pull-ups, 5 ring dips, 5 muscle-up transitions', 20, 'intermediate', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM routines WHERE name = 'Skill Work');
    
    INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, active)
    SELECT 'Cardio', 'Running Intervals', 'cardio', '5 rounds: 400m run @ 80%, 2min rest', 25, 'beginner', admin_id, true
    WHERE NOT EXISTS (SELECT 1 FROM routines WHERE name = 'Cardio');
END $$;

