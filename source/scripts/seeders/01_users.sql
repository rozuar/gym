-- Seeder para usuarios
-- Idempotente: puede ejecutarse múltiples veces sin duplicar datos

-- Crear usuario admin si no existe
INSERT INTO users (email, password_hash, name, phone, role, active)
VALUES (
    'admin@boxmagic.cl',
    '$2a$10$a9iqK3E0/JSFJ3Lbvq9s0u4TL0GEt77wsWKWFa9UgS4Rgx4t4EbCi', -- bcrypt hash de "admin123"
    'Administrador',
    '',
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Crear usuario regular si no existe
INSERT INTO users (email, password_hash, name, phone, role, active)
VALUES (
    'user@boxmagic.cl',
    '$2a$10$y.dvXk3zhnZZg7ZOdvQbgemXTI67pxZOlycnl/92v/1RZUdV4JwOS', -- bcrypt hash de "user123"
    'Usuario Demo',
    '',
    'user',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Nota: Los hashes de contraseña deben generarse con bcrypt
-- Para generar nuevos hashes, usa: go run -c 'golang.org/x/crypto/bcrypt' o el script generate_password_hash.go
