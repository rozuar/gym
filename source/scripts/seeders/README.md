# Seeders SQL

Scripts SQL independientes para poblar la base de datos sin necesidad de hacer deploy del backend.

## ¿Por qué seeders SQL?

- ✅ **Sin costo de deploy**: Ejecutar SQL directamente no requiere hacer deploy del backend
- ✅ **Rápido**: Ejecución inmediata contra la base de datos
- ✅ **Idempotente**: Pueden ejecutarse múltiples veces sin duplicar datos
- ✅ **Flexible**: Puedes ejecutar seeders individuales o el completo

## Uso Rápido

### Desarrollo Local

```bash
# Desde source/
./scripts/seed-db.sh
```

### Railway (Producción)

```bash
# Opción 1: Con Railway CLI
./scripts/seed-railway.sh

# Opción 2: Método directo (recomendado)
# 1. Obtén DATABASE_URL desde Railway dashboard
# 2. Ejecuta:
./scripts/seed-railway-direct.sh 'postgresql://...'
```

## Archivos Disponibles

### `seed_all.sql`
Datos base: usuarios, disciplinas, planes, instructores, rutinas.

### `06_full_demo.sql` (datos de prueba para todas las funciones)
Requiere haber ejecutado antes `seed_all.sql`. Añade:
- **Clases**: WOD Mañana, WOD Tarde (CrossFit), Halterofilia, Gimnasia (con instructores)
- **Horarios** (class_schedules): próximos 14 días según día de la semana de cada clase
- **Pago y suscripción**: usuario demo con Plan Mensual activo
- **Reservas**: usuario demo con hasta 4 reservas en horarios futuros
- **Rutinas asignadas a horarios** (schedule_routines): Fran, Cindy, Helen rotando
- **Resultados de usuario** (user_routine_results): Fran 5:30 RX, Cindy 12 y 13 rounds, Helen 8:45

El script `./scripts/seed-db.sh` ejecuta `seed_all.sql` y luego `06_full_demo.sql`.

### Seeders individuales (solo base)

- `01_users.sql` - Usuarios por defecto
- `02_disciplines.sql` - Disciplinas
- `03_plans.sql` - Planes de suscripción
- `04_instructors.sql` - Instructores
- `05_routines.sql` - Rutinas de ejercicios

## Ejecución Manual

### Con psql

```bash
# Seeder completo
psql "$DATABASE_URL" -f scripts/seeders/seed_all.sql

# Seeder individual
psql "$DATABASE_URL" -f scripts/seeders/01_users.sql
```

### Desde Railway Dashboard

1. Ve a tu proyecto en Railway
2. Abre la base de datos PostgreSQL
3. Ve a la pestaña "Query"
4. Copia y pega el contenido de `seed_all.sql`
5. Ejecuta la query

## Generar Hashes de Contraseña

Si necesitas generar nuevos hashes de contraseña para usuarios (para actualizar los seeders):

```bash
cd backend
go run cmd/tools/hash_password.go <password>
```

Ejemplo:
```bash
cd backend
go run cmd/tools/hash_password.go admin123
# Output: $2a$10$a9iqK3E0/JSFJ3Lbvq9s0u4TL0GEt77wsWKWFa9UgS4Rgx4t4EbCi
```

Luego actualiza el hash en `01_users.sql` o `seed_all.sql`.

## Datos Incluidos

### Usuarios
- **admin@boxmagic.cl** / admin123 (rol: admin)
- **user@boxmagic.cl** / user123 (rol: user)

### Disciplinas
- CrossFit (#FF6B35)
- Halterofilia (#4ECDC4)
- Gimnasia (#45B7D1)

### Planes
- Plan Mensual: $45,000 CLP, ilimitado
- Plan 12 Clases: $35,000 CLP, 12 clases en 30 días
- Plan 8 Clases: $28,000 CLP, 8 clases en 30 días

### Instructores
- Juan Pérez (CrossFit)
- María González (Halterofilia)
- Carlos Rodríguez (Gimnasia)

### Rutinas
- **WODs**: Fran, Cindy, Helen, Grace, Murph
- **Fuerza**: Fuerza A
- **Skill**: Skill Work
- **Cardio**: Cardio

### Con `06_full_demo.sql` además
- Clases con horarios (14 días), reservas del usuario demo, resultados de rutinas (Fran, Cindy, Helen), suscripción activa y pago completado.

## Notas

- Todos los seeders usan `ON CONFLICT DO NOTHING` o verificaciones de existencia, por lo que son seguros de ejecutar múltiples veces
- Las rutinas requieren que exista al menos un usuario admin en la base de datos
- Los hashes de contraseña están pre-generados usando bcrypt
