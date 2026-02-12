-- Seeder para instructores
-- Idempotente: puede ejecutarse múltiples veces sin duplicar datos

INSERT INTO instructors (name, email, phone, specialty, bio, active)
SELECT 'Juan Pérez', 'juan@boxmagic.cl', '+56912345678', 'CrossFit', 'Instructor certificado CrossFit Level 1', true
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE name = 'Juan Pérez');

INSERT INTO instructors (name, email, phone, specialty, bio, active)
SELECT 'María González', 'maria@boxmagic.cl', '+56987654321', 'Halterofilia', 'Especialista en levantamiento olímpico', true
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE name = 'María González');

INSERT INTO instructors (name, email, phone, specialty, bio, active)
SELECT 'Carlos Rodríguez', 'carlos@boxmagic.cl', '+56911223344', 'Gimnasia', 'Experto en gimnasia y calistenia', true
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE name = 'Carlos Rodríguez');
