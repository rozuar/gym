-- Seeder para disciplinas
-- Idempotente: puede ejecutarse múltiples veces sin duplicar datos

INSERT INTO disciplines (name, description, color, active)
SELECT 'CrossFit', 'Entrenamiento funcional de alta intensidad', '#FF6B35', true
WHERE NOT EXISTS (SELECT 1 FROM disciplines WHERE name = 'CrossFit');

INSERT INTO disciplines (name, description, color, active)
SELECT 'Halterofilia', 'Levantamiento olímpico de pesas', '#4ECDC4', true
WHERE NOT EXISTS (SELECT 1 FROM disciplines WHERE name = 'Halterofilia');

INSERT INTO disciplines (name, description, color, active)
SELECT 'Gimnasia', 'Gimnasia deportiva y calistenia', '#45B7D1', true
WHERE NOT EXISTS (SELECT 1 FROM disciplines WHERE name = 'Gimnasia');
