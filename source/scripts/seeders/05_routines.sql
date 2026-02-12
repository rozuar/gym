-- Seeder para rutinas
-- Idempotente: puede ejecutarse múltiples veces sin duplicar datos
-- Requiere que exista al menos un usuario admin

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
        RAISE NOTICE 'Advertencia: No se encontró usuario admin. Las rutinas se crearán sin created_by. Ejecuta 01_users.sql primero.';
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
