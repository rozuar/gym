-- Seeder de clases y horarios para Box Magic
-- Crea un horario semanal realista de CrossFit box
-- Idempotente: comprueba existencia antes de insertar
-- Requiere: 01 a 04 ya ejecutados (usuarios, disciplinas, planes, instructores)

DO $$
DECLARE
    d_cross INTEGER;
    d_halter INTEGER;
    d_gimnasia INTEGER;
    inst_juan INTEGER;
    inst_maria INTEGER;
    inst_carlos INTEGER;
    new_class_id INTEGER;
    i INTEGER;
    d DATE;
    dow INTEGER;
BEGIN
    -- Resolver IDs de disciplinas
    SELECT id INTO d_cross FROM disciplines WHERE name = 'CrossFit' LIMIT 1;
    SELECT id INTO d_halter FROM disciplines WHERE name = 'Halterofilia' LIMIT 1;
    SELECT id INTO d_gimnasia FROM disciplines WHERE name = 'Gimnasia' LIMIT 1;

    -- Resolver IDs de instructores
    SELECT id INTO inst_juan FROM instructors WHERE name = 'Juan Pérez' LIMIT 1;
    SELECT id INTO inst_maria FROM instructors WHERE name = 'María González' LIMIT 1;
    SELECT id INTO inst_carlos FROM instructors WHERE name = 'Carlos Rodríguez' LIMIT 1;

    IF d_cross IS NULL OR d_halter IS NULL OR d_gimnasia IS NULL THEN
        RAISE NOTICE 'Saltando 06_classes_schedules: ejecuta antes seeders 01-04 (disciplinas requeridas).';
        RETURN;
    END IF;

    -- ========================================
    -- CLASES DE CROSSFIT (Juan Pérez)
    -- ========================================

    -- WOD 7:00 AM — Lunes a Viernes
    FOR i IN 1..5 LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'WOD 7AM' AND discipline_id = d_cross AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_cross, 'WOD 7AM', 'CrossFit matutino - WOD del día', i, '07:00', '08:00', 15, true)
            RETURNING id INTO new_class_id;
            IF inst_juan IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_juan) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- WOD 9:00 AM — Lunes a Viernes
    FOR i IN 1..5 LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'WOD 9AM' AND discipline_id = d_cross AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_cross, 'WOD 9AM', 'CrossFit media mañana', i, '09:00', '10:00', 12, true)
            RETURNING id INTO new_class_id;
            IF inst_juan IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_juan) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- WOD 12:00 PM — Lunes, Miércoles, Viernes
    FOREACH i IN ARRAY ARRAY[1, 3, 5] LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'WOD 12PM' AND discipline_id = d_cross AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_cross, 'WOD 12PM', 'CrossFit mediodía', i, '12:00', '13:00', 10, true)
            RETURNING id INTO new_class_id;
            IF inst_juan IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_juan) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- WOD 18:00 PM — Lunes a Viernes
    FOR i IN 1..5 LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'WOD 18PM' AND discipline_id = d_cross AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_cross, 'WOD 18PM', 'CrossFit tarde - Horario peak', i, '18:00', '19:00', 15, true)
            RETURNING id INTO new_class_id;
            IF inst_juan IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_juan) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- WOD 19:30 PM — Lunes a Jueves
    FOR i IN 1..4 LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'WOD 19:30PM' AND discipline_id = d_cross AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_cross, 'WOD 19:30PM', 'CrossFit noche', i, '19:30', '20:30', 12, true)
            RETURNING id INTO new_class_id;
            IF inst_juan IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_juan) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- WOD Sábado 10:00 AM
    IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'WOD Sábado' AND discipline_id = d_cross AND day_of_week = 6) THEN
        INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
        VALUES (d_cross, 'WOD Sábado', 'CrossFit sabatino - Team WOD', 6, '10:00', '11:30', 20, true)
        RETURNING id INTO new_class_id;
        IF inst_juan IS NOT NULL THEN
            INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_juan) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- ========================================
    -- CLASES DE HALTEROFILIA (María González)
    -- ========================================

    -- Halterofilia Técnica — Martes y Jueves 10:00
    FOREACH i IN ARRAY ARRAY[2, 4] LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Halterofilia Técnica' AND discipline_id = d_halter AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_halter, 'Halterofilia Técnica', 'Snatch y Clean & Jerk - Técnica y progresiones', i, '10:00', '11:00', 8, true)
            RETURNING id INTO new_class_id;
            IF inst_maria IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_maria) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- Halterofilia Fuerza — Miércoles y Viernes 17:00
    FOREACH i IN ARRAY ARRAY[3, 5] LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Halterofilia Fuerza' AND discipline_id = d_halter AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_halter, 'Halterofilia Fuerza', 'Back Squat, Front Squat, Deadlift - Ciclos de fuerza', i, '17:00', '18:00', 8, true)
            RETURNING id INTO new_class_id;
            IF inst_maria IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_maria) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- Halterofilia Sábado 11:30
    IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Halterofilia Open' AND discipline_id = d_halter AND day_of_week = 6) THEN
        INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
        VALUES (d_halter, 'Halterofilia Open', 'Práctica libre con guía técnica', 6, '11:30', '12:30', 6, true)
        RETURNING id INTO new_class_id;
        IF inst_maria IS NOT NULL THEN
            INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_maria) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- ========================================
    -- CLASES DE GIMNASIA (Carlos Rodríguez)
    -- ========================================

    -- Gimnasia Skill — Lunes y Miércoles 10:00
    FOREACH i IN ARRAY ARRAY[1, 3] LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Gimnasia Skill' AND discipline_id = d_gimnasia AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_gimnasia, 'Gimnasia Skill', 'Muscle-ups, handstand walks, ring work', i, '10:00', '11:00', 10, true)
            RETURNING id INTO new_class_id;
            IF inst_carlos IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_carlos) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- Gimnasia Avanzada — Viernes 10:00
    IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Gimnasia Avanzada' AND discipline_id = d_gimnasia AND day_of_week = 5) THEN
        INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
        VALUES (d_gimnasia, 'Gimnasia Avanzada', 'Ring muscle-ups, deficit HSPU, freestanding HSW', 5, '10:00', '11:00', 8, true)
        RETURNING id INTO new_class_id;
        IF inst_carlos IS NOT NULL THEN
            INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_carlos) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- Calistenia — Martes y Jueves 17:00
    FOREACH i IN ARRAY ARRAY[2, 4] LOOP
        IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Calistenia' AND discipline_id = d_gimnasia AND day_of_week = i) THEN
            INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
            VALUES (d_gimnasia, 'Calistenia', 'Progresiones de calistenia y control corporal', i, '17:00', '18:00', 10, true)
            RETURNING id INTO new_class_id;
            IF inst_carlos IS NOT NULL THEN
                INSERT INTO class_instructors (class_id, instructor_id) VALUES (new_class_id, inst_carlos) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- ========================================
    -- GENERAR HORARIOS (próximos 21 días)
    -- ========================================
    FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + 20, '1 day'::interval)::date
    LOOP
        dow := EXTRACT(DOW FROM d)::integer;

        INSERT INTO class_schedules (class_id, date, capacity, booked, cancelled)
        SELECT cl.id, d, cl.capacity, 0, false
        FROM classes cl
        WHERE cl.day_of_week = dow
          AND cl.active = true
          AND NOT EXISTS (SELECT 1 FROM class_schedules cs WHERE cs.class_id = cl.id AND cs.date = d)
        ON CONFLICT (class_id, date) DO NOTHING;
    END LOOP;

    RAISE NOTICE '06_classes_schedules: clases y horarios creados (3 semanas).';
END $$;
