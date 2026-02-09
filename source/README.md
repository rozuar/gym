# Box Magic

Sistema de gestión para gimnasios y boxes de CrossFit.

## Estructura

```
source/
├── backend/      # API en Go
├── frontend/     # App web (Next.js)
├── backoffice/   # Panel admin (Next.js)
├── mobile/       # App Android (Kotlin) - pendiente
└── scripts/      # Scripts de utilidad
```

## Requisitos

- Go 1.24+
- Node.js 20+
- PostgreSQL 15+
- Docker (opcional)

## Desarrollo Local

### Opción 1: Con Docker (recomendado)

```bash
# Iniciar PostgreSQL
./scripts/dev.sh

# En terminales separadas:
cd backend && go run cmd/api/main.go
cd frontend && npm run dev
cd backoffice && npm run dev -- -p 3001
```

### Opción 2: Sin Docker

1. Instalar PostgreSQL localmente
2. Crear base de datos `boxmagic`
3. Configurar variables de entorno
4. Ejecutar cada servicio

## URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| API | http://localhost:8080 |
| Frontend | http://localhost:3000 |
| Backoffice | http://localhost:3001 |

## Variables de Entorno

```bash
# Backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/boxmagic?sslmode=disable
JWT_SECRET=dev-secret-change-in-production
API_PORT=8080

# Frontend/Backoffice
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Datos Iniciales

```bash
# Después de iniciar el backend
./scripts/seed.sh
```

Credenciales admin por defecto:
- Email: admin@boxmagic.cl
- Password: admin123

## Despliegue

### Docker Compose (Producción local)

```bash
docker-compose up -d
```

### Railway

Ver guía completa en `context/refined/despliegue-railway.md`

## API Endpoints

### Públicos
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/plans` - Listar planes
- `GET /api/v1/schedules` - Ver horarios

### Usuarios
- `GET /api/v1/users/me` - Mi perfil
- `POST /api/v1/payments` - Realizar pago
- `POST /api/v1/schedules/{id}/book` - Reservar clase
- `GET /api/v1/bookings/me` - Mis reservas
- `POST /api/v1/results` - Registrar resultado de rutina
- `GET /api/v1/results/me` - Mis resultados
- `PUT /api/v1/results/{id}` - Actualizar resultado
- `DELETE /api/v1/results/{id}` - Eliminar resultado
- `GET /api/v1/routines/{id}/history` - Historial por rutina

### Admin
- `GET /api/v1/stats/dashboard` - Dashboard
- `GET /api/v1/users` - Listar usuarios
- CRUD completo de planes, clases, rutinas

## Instructores/Profesores

### Sistema de Instructores

Los instructores son entidades separadas del sistema, no son usuarios. Se gestionan independientemente y se asignan a clases y rutinas.

### Características

- **Entidades separadas**: Los instructores tienen su propia tabla (`instructors`) y CRUD completo.
- **Asignación a clases**: Una clase puede tener **1 o 2 instructores** asignados (máximo 2).
- **Asignación a rutinas**: Una rutina puede tener **0 o 1 instructor** asignado (opcional).
- **Sin límite de clases**: Un instructor puede tener múltiples clases asignadas sin restricción. No hay límite automático en el número de clases que un instructor puede impartir.
- **Sin validación de horarios**: El sistema no valida automáticamente si un instructor tiene clases superpuestas. Si se requiere evitar conflictos de horario, debe gestionarse manualmente.

### Gestión de Instructores

**Endpoints disponibles (admin):**
- `GET /api/v1/instructors` - Listar instructores
- `GET /api/v1/instructors/{id}` - Obtener instructor
- `POST /api/v1/instructors` - Crear instructor
- `PUT /api/v1/instructors/{id}` - Actualizar instructor
- `DELETE /api/v1/instructors/{id}` - Eliminar instructor (soft delete)

### Asignación a Clases

Al crear o actualizar una clase, se puede especificar `instructor_ids` (array de 1-2 IDs):

```json
// Crear clase con 1-2 instructores
POST /api/v1/classes
{
  "discipline_id": 1,
  "name": "WOD Mañana",
  "instructor_ids": [1, 2],  // 1 o 2 instructores máximo
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "10:00",
  "capacity": 12
}
```

### Asignación a Rutinas

Al crear o actualizar una rutina, se puede especificar `instructor_id` (opcional):

```json
// Crear rutina con instructor opcional
POST /api/v1/routines
{
  "name": "Fran",
  "type": "wod",
  "content": "Thruster 43kg, Pull-ups",
  "instructor_id": 1,  // Opcional, puede ser null
  "duration": 10,
  "difficulty": "rx"
}
```

## Stack Tecnológico

- **Backend**: Go 1.24, PostgreSQL
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backoffice**: Next.js 14, TypeScript, Tailwind CSS
- **Infraestructura**: Docker, Railway
