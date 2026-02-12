-- Seeder de datos de prueba para todas las funciones
-- Clases, horarios, pagos, suscripciones, reservas, rutinas asignadas, resultados de usuario
-- Idempotente: comprueba existencia antes de insertar (evita duplicados por nombre/fecha)
-- Requiere: 01 a 05 ya ejecutados (usuarios, disciplinas, planes, instructores, rutinas)

DO $$
DECLARE
    admin_id INTEGER;
    user_id INTEGER;
    plan_id INTEGER;
    pay_id INTEGER;
    sub_id INTEGER;
    d_cross INTEGER;
    d_halter INTEGER;
    d_gimnasia INTEGER;
    inst_juan INTEGER;
    inst_maria INTEGER;
    inst_carlos INTEGER;
    c1 INTEGER;
    c2 INTEGER;
    c3 INTEGER;
    c4 INTEGER;
    sched RECORD;
    r_fran INTEGER;
    r_cindy INTEGER;
    r_helen INTEGER;
    booked_count INTEGER := 0;
    start_date DATE;
    end_date DATE;
    d DATE;
    dow INTEGER;
    r_id INTEGER;
    idx INTEGER := 0;
BEGIN
    -- Resolver IDs base
    SELECT id INTO admin_id FROM users WHERE email = 'admin@boxmagic.cl' LIMIT 1;
    SELECT id INTO user_id FROM users WHERE email = 'user@boxmagic.cl' LIMIT 1;
    SELECT id INTO plan_id FROM plans WHERE name = 'Plan Mensual' LIMIT 1;
    SELECT id INTO d_cross FROM disciplines WHERE name = 'CrossFit' LIMIT 1;
    SELECT id INTO d_halter FROM disciplines WHERE name = 'Halterofilia' LIMIT 1;
    SELECT id INTO d_gimnasia FROM disciplines WHERE name = 'Gimnasia' LIMIT 1;
    SELECT id INTO inst_juan FROM instructors WHERE name = 'Juan Pérez' LIMIT 1;
    SELECT id INTO inst_maria FROM instructors WHERE name = 'María González' LIMIT 1;
    SELECT id INTO inst_carlos FROM instructors WHERE name = 'Carlos Rodríguez' LIMIT 1;
    SELECT id INTO r_fran FROM routines WHERE name = 'Fran' LIMIT 1;
    SELECT id INTO r_cindy FROM routines WHERE name = 'Cindy' LIMIT 1;
    SELECT id INTO r_helen FROM routines WHERE name = 'Helen' LIMIT 1;

    IF user_id IS NULL OR plan_id IS NULL OR d_cross IS NULL THEN
        RAISE NOTICE 'Saltando 06_full_demo: ejecuta antes seed_all (usuarios, disciplinas, planes).';
        RETURN;
    END IF;

    -- ========== CLASES ==========
    IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'WOD Mañana' AND discipline_id = d_cross) THEN
        INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
        VALUES (d_cross, 'WOD Mañana', 'CrossFit AM', 1, '09:00', '10:00', 12, true)
        RETURNING id INTO c1;
        IF inst_juan IS NOT NULL THEN
            INSERT INTO class_instructors (class_id, instructor_id) VALUES (c1, inst_juan)
            ON CONFLICT (class_id, instructor_id) DO NOTHING;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'WOD Tarde' AND discipline_id = d_cross) THEN
        INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
        VALUES (d_cross, 'WOD Tarde', 'CrossFit PM', 2, '18:00', '19:00', 12, true)
        RETURNING id INTO c2;
        IF inst_juan IS NOT NULL THEN
            INSERT INTO class_instructors (class_id, instructor_id) VALUES (c2, inst_juan)
            ON CONFLICT (class_id, instructor_id) DO NOTHING;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Halterofilia' AND discipline_id = d_halter) THEN
        INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
        VALUES (d_halter, 'Halterofilia', 'Técnica y fuerza', 3, '10:00', '11:00', 8, true)
        RETURNING id INTO c3;
        IF inst_maria IS NOT NULL THEN
            INSERT INTO class_instructors (class_id, instructor_id) VALUES (c3, inst_maria)
            ON CONFLICT (class_id, instructor_id) DO NOTHING;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Gimnasia' AND discipline_id = d_gimnasia) THEN
        INSERT INTO classes (discipline_id, name, description, day_of_week, start_time, end_time, capacity, active)
        VALUES (d_gimnasia, 'Gimnasia', 'Skill y muscle-up', 4, '17:00', '18:00', 10, true)
        RETURNING id INTO c4;
        IF inst_carlos IS NOT NULL THEN
            INSERT INTO class_instructors (class_id, instructor_id) VALUES (c4, inst_carlos)
            ON CONFLICT (class_id, instructor_id) DO NOTHING;
        END IF;
    END IF;

    -- ========== HORARIOS (próximos 14 días por clase) ==========
    FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + 13, '1 day'::interval)::date
    LOOP
        dow := EXTRACT(DOW FROM d)::integer; -- 0=Dom, 1=Lun, ... 6=Sab (igual que day_of_week en classes)

        INSERT INTO class_schedules (class_id, date, capacity, booked, cancelled)
        SELECT cl.id, d, cl.capacity, 0, false
        FROM classes cl
        WHERE cl.day_of_week = dow
          AND NOT EXISTS (SELECT 1 FROM class_schedules cs WHERE cs.class_id = cl.id AND cs.date = d)
        ON CONFLICT (class_id, date) DO NOTHING;
    END LOOP;

    -- ========== PAGO Y SUSCRIPCIÓN (usuario demo) ==========
    IF plan_id IS NOT NULL AND user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM subscriptions WHERE subscriptions.user_id = user_id AND active = true) THEN
        INSERT INTO payments (user_id, plan_id, amount, currency, status, payment_method)
        VALUES (user_id, plan_id, 45000, 'CLP', 'completed', 'demo')
        RETURNING id INTO pay_id;
        start_date := CURRENT_DATE;
        end_date := start_date + (SELECT duration FROM plans WHERE id = plan_id LIMIT 1);
        INSERT INTO subscriptions (user_id, plan_id, payment_id, start_date, end_date, classes_used, classes_allowed, active)
        VALUES (user_id, plan_id, pay_id, start_date, end_date, 0, 999, true)
        RETURNING id INTO sub_id;

        -- ========== RESERVAS (usuario en algunos horarios) ==========
        FOR sched IN
            SELECT cs.id
            FROM class_schedules cs
            WHERE cs.date >= CURRENT_DATE
              AND cs.booked < cs.capacity
            ORDER BY cs.date
            LIMIT 5
        LOOP
            IF NOT EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = user_id AND b.class_schedule_id = sched.id) THEN
                INSERT INTO bookings (user_id, class_schedule_id, subscription_id, status)
                VALUES (user_id, sched.id, sub_id, 'booked')
                ON CONFLICT (user_id, class_schedule_id) DO NOTHING;
                UPDATE class_schedules SET booked = booked + 1 WHERE id = sched.id;
                booked_count := booked_count + 1;
                EXIT WHEN booked_count >= 4;
            END IF;
        END LOOP;
    END IF;

    -- ========== RUTINA ASIGNADA A HORARIOS (schedule_routines) ==========
    idx := 0;
    FOR sched IN
        SELECT cs.id FROM class_schedules cs
        WHERE cs.date >= CURRENT_DATE
          AND NOT EXISTS (SELECT 1 FROM schedule_routines sr WHERE sr.class_schedule_id = cs.id)
        ORDER BY cs.date
        LIMIT 12
    LOOP
        r_id := CASE (idx % 3)
            WHEN 0 THEN r_fran
            WHEN 1 THEN r_cindy
            ELSE r_helen
        END;
        IF r_id IS NOT NULL THEN
            INSERT INTO schedule_routines (class_schedule_id, routine_id, notes)
            VALUES (sched.id, r_id, 'WOD del día')
            ON CONFLICT (class_schedule_id) DO NOTHING;
        END IF;
        idx := idx + 1;
    END LOOP;

    -- ========== RESULTADOS DE RUTINA (user_routine_results) ==========
    IF user_id IS NOT NULL AND r_fran IS NOT NULL AND NOT EXISTS (SELECT 1 FROM user_routine_results ur WHERE ur.user_id = user_id AND ur.routine_id = r_fran LIMIT 1) THEN
        INSERT INTO user_routine_results (user_id, routine_id, score, notes, rx)
        VALUES (user_id, r_fran, '5:30', 'Buen WOD', true);
    END IF;
    IF user_id IS NOT NULL AND r_cindy IS NOT NULL AND (SELECT COUNT(*) FROM user_routine_results ur WHERE ur.user_id = user_id AND ur.routine_id = r_cindy) < 2 THEN
        INSERT INTO user_routine_results (user_id, routine_id, score, notes, rx)
        VALUES (user_id, r_cindy, '12 rounds', 'AMRAP', false);
        INSERT INTO user_routine_results (user_id, routine_id, score, notes, rx)
        SELECT user_id, r_cindy, '13 rounds', 'Mejor que la vez anterior', true
        WHERE NOT EXISTS (SELECT 1 FROM user_routine_results ur WHERE ur.user_id = user_id AND ur.routine_id = r_cindy AND ur.score = '13 rounds');
    END IF;
    IF user_id IS NOT NULL AND r_helen IS NOT NULL AND NOT EXISTS (SELECT 1 FROM user_routine_results ur WHERE ur.user_id = user_id AND ur.routine_id = r_helen LIMIT 1) THEN
        INSERT INTO user_routine_results (user_id, routine_id, score, notes, rx)
        VALUES (user_id, r_helen, '8:45', '3 rondas', false);
    END IF;

    RAISE NOTICE '06_full_demo: clases, horarios, suscripción, reservas, rutinas asignadas y resultados creados/actualizados.';
END $$;
