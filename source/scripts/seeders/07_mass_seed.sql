-- Seed masivo: 100 usuarios chilenos con 11 meses de historial
-- Requiere: 01-06 ya ejecutados (usuarios, disciplinas, planes, instructores, rutinas, clases)
-- Idempotente: verifica existencia por email antes de insertar

DO $$
DECLARE
    -- Password hash for "user123"
    pw_hash TEXT := '$2a$10$y.dvXk3zhnZZg7ZOdvQbgemXTI67pxZOlycnl/92v/1RZUdV4JwOS';
    admin_id INTEGER;
    plan_mensual INTEGER;
    plan_12 INTEGER;
    plan_8 INTEGER;
    -- User loop vars
    u RECORD;
    uid INTEGER;
    user_age INTEGER;
    user_plan_id INTEGER;
    plan_price INTEGER;
    plan_max_classes INTEGER;
    inscription_date DATE;
    -- Payment loop vars
    pay_id INTEGER;
    sub_start DATE;
    sub_end DATE;
    pay_amount INTEGER;
    days_in_first INTEGER;
    cur_month DATE;
    payment_methods TEXT[] := ARRAY['efectivo','debito','transferencia'];
    pm TEXT;
    -- Routine vars
    r_id INTEGER;
    routine_name TEXT;
    routine_desc TEXT;
    routine_type TEXT;
    routine_content TEXT;
    routine_duration INTEGER;
    routine_difficulty TEXT;
BEGIN
    -- Resolver IDs base
    SELECT id INTO admin_id FROM users WHERE email = 'admin@boxmagic.cl' LIMIT 1;
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;
    END IF;
    SELECT id INTO plan_mensual FROM plans WHERE name = 'Plan Mensual' LIMIT 1;
    SELECT id INTO plan_12 FROM plans WHERE name = 'Plan 12 Clases' LIMIT 1;
    SELECT id INTO plan_8 FROM plans WHERE name = 'Plan 8 Clases' LIMIT 1;

    IF plan_mensual IS NULL THEN
        RAISE NOTICE '07_mass_seed: ejecuta antes los seeders 01-06.';
        RETURN;
    END IF;

    -- =============================================
    -- 100 USUARIOS (50 hombres, 50 mujeres)
    -- =============================================
    -- Temp table with user data
    CREATE TEMP TABLE IF NOT EXISTS seed_users (
        idx SERIAL,
        name TEXT, email TEXT, phone TEXT, sex TEXT,
        birth_date DATE, weight_kg NUMERIC(5,2), height_cm NUMERIC(5,2),
        plan_type TEXT, -- 'mensual', '12clases', '8clases'
        inscription_offset INTEGER -- days ago from today
    ) ON COMMIT DROP;

    DELETE FROM seed_users;

    -- Helper: inscription_offset spreads users across 11 months (0 to 330 days ago)
    -- Plan distribution: 60 mensual, 25 plan_12, 15 plan_8
    -- Hombres (1-50)
    INSERT INTO seed_users (name, email, phone, sex, birth_date, weight_kg, height_cm, plan_type, inscription_offset) VALUES
    ('Matías Fernández', 'matias.fernandez@email.cl', '+56911000001', 'M', '1995-03-15', 78.5, 175.0, 'mensual', 320),
    ('Sebastián Muñoz', 'sebastian.munoz@email.cl', '+56911000002', 'M', '1990-07-22', 82.0, 178.0, 'mensual', 310),
    ('Benjamín Soto', 'benjamin.soto@email.cl', '+56911000003', 'M', '1988-11-03', 85.3, 180.0, 'mensual', 300),
    ('Vicente Torres', 'vicente.torres@email.cl', '+56911000004', 'M', '2000-01-28', 72.0, 172.0, 'mensual', 290),
    ('Martín Araya', 'martin.araya@email.cl', '+56911000005', 'M', '1985-06-10', 90.2, 176.0, 'mensual', 280),
    ('Nicolás Espinoza', 'nicolas.espinoza@email.cl', '+56911000006', 'M', '1993-09-18', 76.8, 174.0, 'mensual', 270),
    ('Tomás Contreras', 'tomas.contreras@email.cl', '+56911000007', 'M', '1998-04-05', 74.0, 177.0, '12clases', 260),
    ('Felipe Rojas', 'felipe.rojas@email.cl', '+56911000008', 'M', '1987-12-20', 88.5, 182.0, 'mensual', 250),
    ('Agustín Díaz', 'agustin.diaz@email.cl', '+56911000009', 'M', '1996-02-14', 79.0, 176.0, 'mensual', 240),
    ('Joaquín Reyes', 'joaquin.reyes@email.cl', '+56911000010', 'M', '1992-08-30', 81.5, 179.0, 'mensual', 230),
    ('Diego Morales', 'diego.morales@email.cl', '+56911000011', 'M', '2001-05-12', 70.0, 170.0, '12clases', 220),
    ('Gabriel Jiménez', 'gabriel.jimenez@email.cl', '+56911000012', 'M', '1989-10-25', 84.0, 181.0, 'mensual', 210),
    ('Lucas Herrera', 'lucas.herrera@email.cl', '+56911000013', 'M', '1994-01-08', 77.2, 175.0, 'mensual', 200),
    ('Daniel Vargas', 'daniel.vargas@email.cl', '+56911000014', 'M', '1986-07-17', 92.0, 183.0, '8clases', 190),
    ('Maximiliano Castro', 'maximiliano.castro@email.cl', '+56911000015', 'M', '1997-03-22', 75.5, 174.0, 'mensual', 180),
    ('Ignacio Sepúlveda', 'ignacio.sepulveda@email.cl', '+56911000016', 'M', '1991-11-09', 80.0, 177.0, 'mensual', 170),
    ('Alejandro Vera', 'alejandro.vera@email.cl', '+56911000017', 'M', '2008-06-15', 58.0, 165.0, 'mensual', 160),
    ('Cristóbal Núñez', 'cristobal.nunez@email.cl', '+56911000018', 'M', '1999-09-01', 73.5, 173.0, '12clases', 150),
    ('Renato Figueroa', 'renato.figueroa@email.cl', '+56911000019', 'M', '1984-04-28', 95.0, 179.0, 'mensual', 140),
    ('Andrés Tapia', 'andres.tapia@email.cl', '+56911000020', 'M', '1993-12-03', 78.0, 176.0, 'mensual', 130),
    ('Carlos Bravo', 'carlos.bravo@email.cl', '+56911000021', 'M', '1975-02-19', 86.0, 174.0, '8clases', 120),
    ('Pablo Fuentes', 'pablo.fuentes@email.cl', '+56911000022', 'M', '1990-08-11', 80.5, 178.0, 'mensual', 115),
    ('Eduardo Valenzuela', 'eduardo.valenzuela@email.cl', '+56911000023', 'M', '2009-01-20', 55.0, 162.0, '12clases', 110),
    ('Francisco Olivares', 'francisco.olivares@email.cl', '+56911000024', 'M', '1982-05-07', 88.0, 180.0, 'mensual', 105),
    ('Rodrigo Pizarro', 'rodrigo.pizarro@email.cl', '+56911000025', 'M', '1996-10-14', 76.0, 175.0, 'mensual', 100),
    ('José Aravena', 'jose.aravena@email.cl', '+56911000026', 'M', '1970-03-25', 82.5, 172.0, '8clases', 95),
    ('Luis Cárdenas', 'luis.cardenas@email.cl', '+56911000027', 'M', '1988-07-30', 83.0, 179.0, 'mensual', 90),
    ('Gonzalo Medina', 'gonzalo.medina@email.cl', '+56911000028', 'M', '1994-11-22', 77.8, 176.0, '12clases', 85),
    ('Álvaro Guzmán', 'alvaro.guzman@email.cl', '+56911000029', 'M', '2002-06-08', 71.0, 171.0, 'mensual', 80),
    ('Pedro Orellana', 'pedro.orellana@email.cl', '+56911000030', 'M', '1987-01-15', 89.0, 181.0, 'mensual', 75),
    ('Claudio Sandoval', 'claudio.sandoval@email.cl', '+56911000031', 'M', '1979-09-28', 84.5, 177.0, 'mensual', 70),
    ('Hugo Peña', 'hugo.pena@email.cl', '+56911000032', 'M', '1992-04-17', 79.5, 176.0, '12clases', 65),
    ('Sergio Lagos', 'sergio.lagos@email.cl', '+56911000033', 'M', '1965-12-10', 78.0, 170.0, '8clases', 60),
    ('Mauricio Riquelme', 'mauricio.riquelme@email.cl', '+56911000034', 'M', '1991-03-05', 81.0, 178.0, 'mensual', 55),
    ('Rafael Vega', 'rafael.vega@email.cl', '+56911000035', 'M', '1997-08-19', 74.5, 174.0, 'mensual', 50),
    ('Camilo Zúñiga', 'camilo.zuniga@email.cl', '+56911000036', 'M', '2010-02-12', 52.0, 158.0, 'mensual', 45),
    ('Héctor Carrasco', 'hector.carrasco@email.cl', '+56911000037', 'M', '1986-06-27', 91.0, 180.0, '12clases', 40),
    ('Esteban Leiva', 'esteban.leiva@email.cl', '+56911000038', 'M', '1995-10-08', 77.0, 175.0, 'mensual', 35),
    ('Oscar Jara', 'oscar.jara@email.cl', '+56911000039', 'M', '1973-05-14', 85.5, 176.0, '8clases', 30),
    ('Iván Molina', 'ivan.molina@email.cl', '+56911000040', 'M', '1999-11-30', 73.0, 173.0, 'mensual', 28),
    ('Marco Bustamante', 'marco.bustamante@email.cl', '+56911000041', 'M', '1990-01-22', 82.5, 179.0, 'mensual', 25),
    ('Patricio Campos', 'patricio.campos@email.cl', '+56911000042', 'M', '1983-07-09', 87.0, 180.0, '12clases', 22),
    ('Raúl Garrido', 'raul.garrido@email.cl', '+56911000043', 'M', '1968-04-03', 80.0, 173.0, '8clases', 20),
    ('Jorge Acuña', 'jorge.acuna@email.cl', '+56911000044', 'M', '1994-09-16', 78.5, 176.0, 'mensual', 18),
    ('Manuel Salazar', 'manuel.salazar@email.cl', '+56911000045', 'M', '2003-02-25', 69.0, 170.0, 'mensual', 15),
    ('Roberto Henríquez', 'roberto.henriquez@email.cl', '+56911000046', 'M', '1989-12-11', 84.5, 179.0, 'mensual', 12),
    ('Emilio Cáceres', 'emilio.caceres@email.cl', '+56911000047', 'M', '1996-06-20', 76.5, 175.0, '12clases', 10),
    ('Alfonso Paredes', 'alfonso.paredes@email.cl', '+56911000048', 'M', '1977-08-04', 83.0, 177.0, '8clases', 8),
    ('Javier Cifuentes', 'javier.cifuentes@email.cl', '+56911000049', 'M', '1991-01-18', 80.0, 178.0, 'mensual', 5),
    ('Fernando Alarcón', 'fernando.alarcon@email.cl', '+56911000050', 'M', '2000-10-29', 72.5, 172.0, 'mensual', 3);

    -- Mujeres (51-100)
    INSERT INTO seed_users (name, email, phone, sex, birth_date, weight_kg, height_cm, plan_type, inscription_offset) VALUES
    ('Catalina López', 'catalina.lopez@email.cl', '+56922000001', 'F', '1995-04-12', 60.0, 163.0, 'mensual', 325),
    ('Valentina Silva', 'valentina.silva@email.cl', '+56922000002', 'F', '1991-08-25', 58.5, 160.0, 'mensual', 315),
    ('Isidora García', 'isidora.garcia@email.cl', '+56922000003', 'F', '1988-12-07', 65.0, 165.0, 'mensual', 305),
    ('Florencia Martínez', 'florencia.martinez@email.cl', '+56922000004', 'F', '2001-02-18', 55.0, 158.0, 'mensual', 295),
    ('Antonia Rodríguez', 'antonia.rodriguez@email.cl', '+56922000005', 'F', '1986-06-30', 68.0, 167.0, '12clases', 285),
    ('Emilia Hernández', 'emilia.hernandez@email.cl', '+56922000006', 'F', '1993-10-15', 62.0, 164.0, 'mensual', 275),
    ('Martina González', 'martina.gonzalez@email.cl', '+56922000007', 'F', '1998-03-20', 57.5, 161.0, 'mensual', 265),
    ('Sofía Muñoz', 'sofia.munoz@email.cl', '+56922000008', 'F', '1990-07-08', 63.5, 165.0, '12clases', 255),
    ('Amanda Díaz', 'amanda.diaz@email.cl', '+56922000009', 'F', '1997-01-25', 59.0, 162.0, 'mensual', 245),
    ('Francisca Soto', 'francisca.soto@email.cl', '+56922000010', 'F', '1985-05-14', 66.5, 166.0, 'mensual', 235),
    ('Constanza Rojas', 'constanza.rojas@email.cl', '+56922000011', 'F', '2000-09-03', 56.0, 159.0, 'mensual', 225),
    ('Javiera Torres', 'javiera.torres@email.cl', '+56922000012', 'F', '1992-11-28', 61.5, 163.0, '8clases', 215),
    ('Daniela Araya', 'daniela.araya@email.cl', '+56922000013', 'F', '1989-03-16', 64.0, 165.0, 'mensual', 205),
    ('Camila Espinoza', 'camila.espinoza@email.cl', '+56922000014', 'F', '1994-08-09', 58.0, 161.0, 'mensual', 195),
    ('Fernanda Contreras', 'fernanda.contreras@email.cl', '+56922000015', 'F', '2009-04-22', 48.0, 155.0, '12clases', 185),
    ('Ignacia Reyes', 'ignacia.reyes@email.cl', '+56922000016', 'F', '1987-12-05', 67.0, 166.0, 'mensual', 175),
    ('María José Morales', 'mariajose.morales@email.cl', '+56922000017', 'F', '1996-06-18', 60.5, 163.0, 'mensual', 165),
    ('Rocío Herrera', 'rocio.herrera@email.cl', '+56922000018', 'F', '1991-02-01', 62.5, 164.0, '8clases', 155),
    ('Trinidad Vargas', 'trinidad.vargas@email.cl', '+56922000019', 'F', '1999-10-27', 56.5, 160.0, 'mensual', 145),
    ('Macarena Castro', 'macarena.castro@email.cl', '+56922000020', 'F', '1984-04-10', 70.0, 168.0, 'mensual', 135),
    ('Carolina Sepúlveda', 'carolina.sepulveda@email.cl', '+56922000021', 'F', '1993-09-23', 61.0, 163.0, '12clases', 125),
    ('Paulina Vera', 'paulina.vera@email.cl', '+56922000022', 'F', '2008-01-14', 50.0, 156.0, 'mensual', 118),
    ('Andrea Núñez', 'andrea.nunez@email.cl', '+56922000023', 'F', '1988-05-30', 64.5, 165.0, 'mensual', 108),
    ('Tamara Figueroa', 'tamara.figueroa@email.cl', '+56922000024', 'F', '1995-11-16', 59.5, 162.0, '12clases', 102),
    ('Claudia Tapia', 'claudia.tapia@email.cl', '+56922000025', 'F', '1980-03-08', 66.0, 164.0, 'mensual', 98),
    ('Nicole Bravo', 'nicole.bravo@email.cl', '+56922000026', 'F', '1997-07-21', 57.0, 160.0, 'mensual', 92),
    ('Lorena Fuentes', 'lorena.fuentes@email.cl', '+56922000027', 'F', '1972-10-04', 68.5, 163.0, '8clases', 88),
    ('Marcela Valenzuela', 'marcela.valenzuela@email.cl', '+56922000028', 'F', '1990-01-17', 63.0, 164.0, 'mensual', 82),
    ('Natalia Olivares', 'natalia.olivares@email.cl', '+56922000029', 'F', '2002-06-29', 54.5, 158.0, '12clases', 78),
    ('Karen Pizarro', 'karen.pizarro@email.cl', '+56922000030', 'F', '1986-12-12', 65.5, 166.0, 'mensual', 72),
    ('Alejandra Cárdenas', 'alejandra.cardenas@email.cl', '+56922000031', 'F', '1994-04-05', 60.0, 163.0, 'mensual', 68),
    ('Verónica Medina', 'veronica.medina@email.cl', '+56922000032', 'F', '1978-08-18', 67.5, 165.0, '8clases', 62),
    ('Cecilia Guzmán', 'cecilia.guzman@email.cl', '+56922000033', 'F', '1992-02-28', 61.5, 163.0, 'mensual', 58),
    ('Sandra Orellana', 'sandra.orellana@email.cl', '+56922000034', 'F', '1989-06-11', 63.5, 164.0, '12clases', 52),
    ('Viviana Sandoval', 'viviana.sandoval@email.cl', '+56922000035', 'F', '1996-10-24', 58.5, 161.0, 'mensual', 48),
    ('Paola Peña', 'paola.pena@email.cl', '+56922000036', 'F', '1983-01-07', 69.0, 167.0, 'mensual', 42),
    ('Alicia Lagos', 'alicia.lagos@email.cl', '+56922000037', 'F', '1966-05-20', 64.0, 160.0, '8clases', 38),
    ('Gabriela Riquelme', 'gabriela.riquelme@email.cl', '+56922000038', 'F', '1991-09-02', 62.0, 164.0, 'mensual', 32),
    ('Patricia Vega', 'patricia.vega@email.cl', '+56922000039', 'F', '1998-03-15', 57.5, 161.0, 'mensual', 27),
    ('Mónica Zúñiga', 'monica.zuniga@email.cl', '+56922000040', 'F', '2010-07-28', 46.0, 152.0, '12clases', 23),
    ('Rosa Carrasco', 'rosa.carrasco@email.cl', '+56922000041', 'F', '1987-11-10', 66.0, 166.0, 'mensual', 19),
    ('Teresa Leiva', 'teresa.leiva@email.cl', '+56922000042', 'F', '1995-05-23', 59.0, 162.0, '12clases', 16),
    ('Soledad Jara', 'soledad.jara@email.cl', '+56922000043', 'F', '1974-09-06', 65.0, 163.0, '8clases', 14),
    ('Julieta Molina', 'julieta.molina@email.cl', '+56922000044', 'F', '1999-01-19', 56.0, 159.0, 'mensual', 11),
    ('Bárbara Bustamante', 'barbara.bustamante@email.cl', '+56922000045', 'F', '2003-08-01', 53.0, 157.0, 'mensual', 9),
    ('Mercedes Campos', 'mercedes.campos@email.cl', '+56922000046', 'F', '1990-12-14', 63.0, 164.0, 'mensual', 7),
    ('Adriana Garrido', 'adriana.garrido@email.cl', '+56922000047', 'F', '1976-04-27', 67.0, 165.0, '8clases', 6),
    ('Silvia Acuña', 'silvia.acuna@email.cl', '+56922000048', 'F', '1993-08-09', 61.0, 163.0, 'mensual', 4),
    ('Elena Salazar', 'elena.salazar@email.cl', '+56922000049', 'F', '1988-02-22', 64.5, 165.0, '12clases', 2),
    ('Diana Henríquez', 'diana.henriquez@email.cl', '+56922000050', 'F', '2001-11-05', 55.5, 159.0, 'mensual', 1);

    -- =============================================
    -- INSERT USERS + AUTHORIZATIONS + PAYMENTS + SUBSCRIPTIONS + ROUTINES
    -- =============================================
    FOR u IN SELECT * FROM seed_users ORDER BY idx
    LOOP
        -- Skip if user already exists
        IF EXISTS (SELECT 1 FROM users WHERE email = u.email) THEN
            CONTINUE;
        END IF;

        inscription_date := CURRENT_DATE - u.inscription_offset;

        -- Insert user
        INSERT INTO users (email, password_hash, name, phone, role, active, birth_date, sex, weight_kg, height_cm, created_at, updated_at)
        VALUES (u.email, pw_hash, u.name, u.phone, 'user', true, u.birth_date, u.sex, u.weight_kg, u.height_cm, inscription_date::timestamp, inscription_date::timestamp)
        RETURNING id INTO uid;

        -- Resolve plan
        IF u.plan_type = 'mensual' THEN
            user_plan_id := plan_mensual; plan_price := 45000; plan_max_classes := 0;
        ELSIF u.plan_type = '12clases' THEN
            user_plan_id := plan_12; plan_price := 35000; plan_max_classes := 12;
        ELSE
            user_plan_id := plan_8; plan_price := 28000; plan_max_classes := 8;
        END IF;

        -- Age at inscription
        user_age := EXTRACT(YEAR FROM age(inscription_date, u.birth_date))::INTEGER;

        -- ===== AUTHORIZATIONS =====
        -- Everyone signs liability waiver on inscription day
        INSERT INTO authorizations (user_id, document_type, signed_at, created_at)
        VALUES (uid, 'liability_waiver', inscription_date::timestamp, inscription_date::timestamp);

        -- Minors also need parental consent
        IF user_age < 18 THEN
            INSERT INTO authorizations (user_id, document_type, signed_at, guardian_name, guardian_rut, notes, created_at)
            VALUES (
                uid, 'parental_consent', inscription_date::timestamp,
                'Tutor de ' || split_part(u.name, ' ', 1),
                (10000000 + uid * 1000)::TEXT || '-' || (uid % 10)::TEXT,
                'Autorización parental para menor de edad',
                inscription_date::timestamp
            );
        END IF;

        -- ===== PAYMENTS & SUBSCRIPTIONS =====
        -- First payment: prorated
        days_in_first := EXTRACT(DAY FROM (date_trunc('month', inscription_date) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER
                         - EXTRACT(DAY FROM inscription_date)::INTEGER + 1;
        IF days_in_first > 30 THEN days_in_first := 30; END IF;
        pay_amount := ROUND(plan_price::NUMERIC * days_in_first / 30)::INTEGER;

        sub_start := inscription_date;
        -- End of first subscription: last day of inscription month
        sub_end := (date_trunc('month', inscription_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        IF sub_end < sub_start THEN sub_end := sub_start + 30; END IF;

        pm := payment_methods[1 + (uid % 3)];

        INSERT INTO payments (user_id, plan_id, amount, currency, status, payment_method, created_at, updated_at)
        VALUES (uid, user_plan_id, pay_amount, 'CLP', 'completed', pm, sub_start::timestamp, sub_start::timestamp)
        RETURNING id INTO pay_id;

        INSERT INTO subscriptions (user_id, plan_id, payment_id, start_date, end_date, classes_used, classes_allowed, active, created_at)
        VALUES (uid, user_plan_id, pay_id, sub_start, sub_end,
                CASE WHEN plan_max_classes = 0 THEN 0 ELSE LEAST(plan_max_classes, GREATEST(0, (sub_end - sub_start))) END,
                CASE WHEN plan_max_classes = 0 THEN 999 ELSE plan_max_classes END,
                false, sub_start::timestamp);

        -- Subsequent monthly payments
        cur_month := date_trunc('month', inscription_date)::DATE + INTERVAL '1 month';
        WHILE cur_month <= date_trunc('month', CURRENT_DATE)::DATE LOOP
            sub_start := cur_month;
            sub_end := (cur_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
            pm := payment_methods[1 + ((uid + EXTRACT(MONTH FROM cur_month)::INTEGER) % 3)];

            INSERT INTO payments (user_id, plan_id, amount, currency, status, payment_method, created_at, updated_at)
            VALUES (uid, user_plan_id, plan_price, 'CLP', 'completed', pm, sub_start::timestamp, sub_start::timestamp)
            RETURNING id INTO pay_id;

            INSERT INTO subscriptions (user_id, plan_id, payment_id, start_date, end_date, classes_used, classes_allowed, active, created_at)
            VALUES (uid, user_plan_id, pay_id, sub_start, sub_end,
                    CASE WHEN plan_max_classes = 0 THEN 0 ELSE LEAST(plan_max_classes, 30) END,
                    CASE WHEN plan_max_classes = 0 THEN 999 ELSE plan_max_classes END,
                    CASE WHEN cur_month = date_trunc('month', CURRENT_DATE)::DATE THEN true ELSE false END,
                    sub_start::timestamp);

            cur_month := cur_month + INTERVAL '1 month';
        END LOOP;

        -- ===== PERSONALIZED ROUTINE =====
        -- Assign one custom routine per user based on profile
        IF user_age BETWEEN 15 AND 17 THEN
            -- Teens: beginner, bodyweight/skill
            IF u.sex = 'M' THEN
                routine_name := 'Rutina Juvenil M - ' || split_part(u.name, ' ', 1);
                routine_content := 'Warm-up: 5 min jump rope' || chr(10) ||
                    '3 rounds:' || chr(10) ||
                    '  10 Air Squats' || chr(10) ||
                    '  10 Push-ups' || chr(10) ||
                    '  10 Sit-ups' || chr(10) ||
                    '  200m Run' || chr(10) ||
                    'Cool-down: stretching 5 min';
            ELSE
                routine_name := 'Rutina Juvenil F - ' || split_part(u.name, ' ', 1);
                routine_content := 'Warm-up: 5 min jump rope' || chr(10) ||
                    '3 rounds:' || chr(10) ||
                    '  10 Air Squats' || chr(10) ||
                    '  8 Push-ups (rodillas)' || chr(10) ||
                    '  10 Sit-ups' || chr(10) ||
                    '  200m Run' || chr(10) ||
                    'Cool-down: stretching 5 min';
            END IF;
            routine_type := 'wod'; routine_duration := 20; routine_difficulty := 'beginner';

        ELSIF user_age BETWEEN 18 AND 30 THEN
            IF u.weight_kg > (CASE WHEN u.sex = 'M' THEN 85 ELSE 68 END) THEN
                -- Overweight: more cardio, work capacity
                IF u.sex = 'M' THEN
                    routine_name := 'WOD Cardio - ' || split_part(u.name, ' ', 1);
                    routine_content := 'AMRAP 20 min:' || chr(10) ||
                        '  400m Row' || chr(10) ||
                        '  15 Wall Balls 9kg' || chr(10) ||
                        '  10 Box Jumps 50cm' || chr(10) ||
                        '  10 KB Swings 16kg';
                ELSE
                    routine_name := 'WOD Cardio - ' || split_part(u.name, ' ', 1);
                    routine_content := 'AMRAP 20 min:' || chr(10) ||
                        '  400m Row' || chr(10) ||
                        '  12 Wall Balls 6kg' || chr(10) ||
                        '  10 Box Jumps 40cm' || chr(10) ||
                        '  10 KB Swings 12kg';
                END IF;
                routine_type := 'wod'; routine_duration := 25; routine_difficulty := 'intermediate';
            ELSE
                -- Normal weight: classic WODs
                IF u.sex = 'M' THEN
                    routine_name := 'WOD RX - ' || split_part(u.name, ' ', 1);
                    routine_content := 'For time:' || chr(10) ||
                        '  21-15-9' || chr(10) ||
                        '  Thrusters 43kg' || chr(10) ||
                        '  Pull-ups' || chr(10) ||
                        'Then: 3x5 Back Squat @ 80%';
                ELSE
                    routine_name := 'WOD RX - ' || split_part(u.name, ' ', 1);
                    routine_content := 'For time:' || chr(10) ||
                        '  21-15-9' || chr(10) ||
                        '  Thrusters 30kg' || chr(10) ||
                        '  Pull-ups (banda)' || chr(10) ||
                        'Then: 3x5 Back Squat @ 75%';
                END IF;
                routine_type := 'wod'; routine_duration := 25; routine_difficulty := 'advanced';
            END IF;

        ELSIF user_age BETWEEN 31 AND 50 THEN
            -- Balanced mix
            IF u.sex = 'M' THEN
                routine_name := 'Rutina Balanceada - ' || split_part(u.name, ' ', 1);
                routine_content := '3 rounds for time:' || chr(10) ||
                    '  12 Deadlift 70kg' || chr(10) ||
                    '  9 Hang Power Clean 50kg' || chr(10) ||
                    '  6 Push Jerk 50kg' || chr(10) ||
                    '  400m Run' || chr(10) ||
                    'Accessory: 3x12 GHD Sit-ups';
            ELSE
                routine_name := 'Rutina Balanceada - ' || split_part(u.name, ' ', 1);
                routine_content := '3 rounds for time:' || chr(10) ||
                    '  12 Deadlift 47kg' || chr(10) ||
                    '  9 Hang Power Clean 30kg' || chr(10) ||
                    '  6 Push Jerk 30kg' || chr(10) ||
                    '  400m Run' || chr(10) ||
                    'Accessory: 3x12 Sit-ups';
            END IF;
            routine_type := 'wod'; routine_duration := 30; routine_difficulty := 'intermediate';

        ELSE
            -- 50+: mobility and low impact
            IF u.sex = 'M' THEN
                routine_name := 'Rutina Senior - ' || split_part(u.name, ' ', 1);
                routine_content := 'Warm-up: 10 min bike' || chr(10) ||
                    '4 rounds:' || chr(10) ||
                    '  8 Goblet Squat 12kg' || chr(10) ||
                    '  8 Ring Rows' || chr(10) ||
                    '  8 KB Press 10kg' || chr(10) ||
                    '  200m Walk' || chr(10) ||
                    'Mobility: 10 min foam roll';
            ELSE
                routine_name := 'Rutina Senior - ' || split_part(u.name, ' ', 1);
                routine_content := 'Warm-up: 10 min bike' || chr(10) ||
                    '4 rounds:' || chr(10) ||
                    '  8 Goblet Squat 8kg' || chr(10) ||
                    '  8 Ring Rows' || chr(10) ||
                    '  8 KB Press 6kg' || chr(10) ||
                    '  200m Walk' || chr(10) ||
                    'Mobility: 10 min foam roll';
            END IF;
            routine_type := 'wod'; routine_duration := 35; routine_difficulty := 'beginner';
        END IF;

        routine_desc := 'Rutina personalizada para ' || u.name;

        INSERT INTO routines (name, description, type, content, duration, difficulty, created_by, target_user_id, is_custom, active, created_at, updated_at)
        VALUES (routine_name, routine_desc, routine_type, routine_content, routine_duration, routine_difficulty,
                admin_id, uid, true, true, inscription_date::timestamp, inscription_date::timestamp);

    END LOOP;

    RAISE NOTICE '07_mass_seed: 100 usuarios con pagos, suscripciones, autorizaciones y rutinas personalizadas creados.';
END $$;
