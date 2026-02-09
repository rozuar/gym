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

## Stack Tecnológico

- **Backend**: Go 1.24, PostgreSQL
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backoffice**: Next.js 14, TypeScript, Tailwind CSS
- **Infraestructura**: Docker, Railway
