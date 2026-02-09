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

### Instructors (admin only)
- `GET /api/v1/instructors` - Listar instructores
- `GET /api/v1/instructors/{id}` - Obtener instructor
- `POST /api/v1/instructors` - Crear instructor
- `PUT /api/v1/instructors/{id}` - Actualizar instructor
- `DELETE /api/v1/instructors/{id}` - Eliminar instructor

### Classes (protegidos)
- `GET /api/v1/classes` - Listar clases
- `GET /api/v1/classes/{id}` - Obtener clase
- `POST /api/v1/classes` - Crear clase (admin)
- `PUT /api/v1/classes/{id}` - Actualizar clase (admin)
- `DELETE /api/v1/classes/{id}` - Eliminar clase (admin)

**Instructores en Clases:**
- Las clases pueden tener 1-2 instructores asignados mediante `instructor_ids` (array)
- Los instructores son entidades separadas (tabla `instructors`)
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

### Tabla de Instructores

Los instructores son entidades separadas con su propia tabla:

```sql
CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialty VARCHAR(100),
  bio TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relación Clase-Instructores

Las clases pueden tener 1-2 instructores mediante tabla de relación:

```sql
CREATE TABLE class_instructors (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, instructor_id)
);
```

**Características:**
- Una clase puede tener 1-2 instructores (máximo 2)
- Un instructor puede tener múltiples clases sin límite
- No hay validación de solapamiento de horarios

### Relación Rutina-Instructor

Las rutinas pueden tener 0-1 instructor (opcional):

```sql
CREATE TABLE routines (
  ...
  instructor_id INTEGER REFERENCES instructors(id),
  ...
);
```

**Ejemplo de respuesta de clase:**
```json
{
  "id": 1,
  "name": "WOD Mañana",
  "instructors": ["Juan Pérez", "María González"],
  "discipline_name": "CrossFit",
  ...
}
```

**Ejemplo de respuesta de rutina:**
```json
{
  "id": 1,
  "name": "Fran",
  "instructor_id": 1,
  "instructor_name": "Juan Pérez",
  ...
}
```
