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

### Asignación de Instructores

Los instructores (profesores) se asignan a las clases mediante el campo `instructor_id`:

- **Cualquier usuario del sistema puede ser instructor**: No hay un rol especial de "instructor". Cualquier usuario (incluidos los usuarios regulares) puede ser asignado como instructor de una clase.
- **Asignación opcional**: El campo `instructor_id` es opcional. Una clase puede existir sin instructor asignado.
- **Sin límite de clases**: Un instructor puede tener múltiples clases asignadas sin restricción. No hay límite automático en el número de clases que un instructor puede impartir.
- **Sin validación de horarios**: El sistema no valida automáticamente si un instructor tiene clases superpuestas. Si se requiere evitar conflictos de horario, debe implementarse validación adicional o gestionarse manualmente.

### Gestión de Instructores

- **Crear clase con instructor**: Al crear una clase, se puede especificar `instructor_id` (opcional).
- **Actualizar instructor**: Se puede cambiar el instructor de una clase existente mediante `PUT /api/v1/classes/{id}`.
- **Listar clases por instructor**: Las clases incluyen el nombre del instructor en las respuestas cuando está asignado.

### Ejemplo de uso

```json
// Crear clase con instructor
POST /api/v1/classes
{
  "discipline_id": 1,
  "name": "WOD Mañana",
  "instructor_id": 5,  // ID del usuario instructor
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "10:00",
  "capacity": 12
}
```

## Stack Tecnológico

- **Backend**: Go 1.24, PostgreSQL
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backoffice**: Next.js 14, TypeScript, Tailwind CSS
- **Infraestructura**: Docker, Railway
