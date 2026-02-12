-- Seeder para planes
-- Idempotente: puede ejecutarse múltiples veces sin duplicar datos

INSERT INTO plans (name, description, price, currency, duration, max_classes, active)
SELECT 'Plan Mensual', 'Acceso ilimitado por 30 dias', 45000, 'CLP', 30, 0, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plan Mensual');

INSERT INTO plans (name, description, price, currency, duration, max_classes, active)
SELECT 'Plan 12 Clases', '12 clases en 30 dias', 35000, 'CLP', 30, 12, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plan 12 Clases');

INSERT INTO plans (name, description, price, currency, duration, max_classes, active)
SELECT 'Plan 8 Clases', '8 clases en 30 dias', 28000, 'CLP', 30, 8, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plan 8 Clases');
