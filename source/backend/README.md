# Backend API

API REST en Go.

## Stack
- Go 1.24+
- PostgreSQL
- JWT para autenticación

## Setup

```bash
# Instalar dependencias
go mod tidy

# Configurar base de datos
cp ../.env.example ../.env
# Editar .env con credenciales de PostgreSQL

# Ejecutar
go run cmd/api/main.go
```

## Estructura

```
backend/
├── cmd/
│   └── api/
│       └── main.go          # Punto de entrada
├── internal/
│   ├── config/              # Configuración
│   ├── handlers/            # HTTP handlers
│   ├── middleware/          # Auth, CORS, Logger
│   ├── models/              # Modelos de datos
│   ├── repository/          # Acceso a BD
│   └── services/            # Lógica de negocio
├── pkg/
│   └── utils/
├── go.mod
└── go.sum
```

## Endpoints

### Auth
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Users (protegidos)
- `GET /api/v1/users/me` - Mi perfil
- `PUT /api/v1/users/me` - Actualizar mi perfil
- `GET /api/v1/users` - Listar (admin)
- `GET /api/v1/users/{id}` - Obtener (admin)
- `PUT /api/v1/users/{id}` - Actualizar (admin)
- `DELETE /api/v1/users/{id}` - Eliminar (admin)

### Classes (protegidos)
- `GET /api/v1/classes` - Listar clases
- `GET /api/v1/classes/{id}` - Obtener clase
- `POST /api/v1/classes` - Crear clase (admin)
- `PUT /api/v1/classes/{id}` - Actualizar clase (admin)
- `DELETE /api/v1/classes/{id}` - Eliminar clase (admin)

**Instructores en Clases:**
- El campo `instructor_id` es opcional y referencia a un usuario del sistema
- Cualquier usuario puede ser asignado como instructor
- Un instructor puede tener múltiples clases sin límite
- No hay validación automática de conflictos de horario

### Results (protegidos)
- `POST /api/v1/results` - Registrar resultado de rutina
- `GET /api/v1/results/me` - Obtener mis resultados
- `PUT /api/v1/results/{id}` - Actualizar resultado propio
- `DELETE /api/v1/results/{id}` - Eliminar resultado propio
- `GET /api/v1/routines/{id}/history` - Historial de resultados por rutina

### Health
- `GET /health` - Health check

## Modelo de Datos - Instructores

### Clases e Instructores

Las clases tienen un campo opcional `instructor_id` que referencia a la tabla `users`:

```sql
CREATE TABLE classes (
  ...
  instructor_id INTEGER REFERENCES users(id),
  ...
);
```

**Características:**
- `instructor_id` es nullable (opcional)
- No hay restricciones de unicidad o límites
- Un usuario puede ser instructor de múltiples clases
- No hay validación de solapamiento de horarios

**Ejemplo de respuesta:**
```json
{
  "id": 1,
  "name": "WOD Mañana",
  "instructor_id": 5,
  "instructor_name": "Juan Pérez",
  "discipline_name": "CrossFit",
  ...
}
```
