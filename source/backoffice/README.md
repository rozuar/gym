# Backoffice - Box Magic

Panel de administración.

## Stack
- Next.js 14
- TypeScript
- Tailwind CSS

## Setup

```bash
npm install
npm run dev -- -p 3001
```

Puerto: 3001

## Estructura

```
src/
├── app/
│   ├── layout.tsx
│   ├── login/              # Login admin
│   └── (dashboard)/        # Rutas protegidas
│       ├── layout.tsx      # Sidebar
│       ├── page.tsx        # Dashboard
│       ├── users/          # Gestión usuarios
│       ├── plans/          # Gestión planes
│       ├── classes/        # Gestión clases
│       ├── schedules/      # Horarios
│       ├── routines/       # Rutinas
│       └── payments/       # Pagos
├── components/
│   ├── layout/Sidebar.tsx
│   └── ui/
├── contexts/AuthContext.tsx
├── lib/api.ts
└── types/
```

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/login` | Login (solo admin) |
| `/` | Dashboard con estadísticas |
| `/users` | Gestión de usuarios |
| `/plans` | CRUD de planes |
| `/classes` | CRUD de clases (asignar instructores) |
| `/schedules` | Ver/generar horarios |
| `/routines` | CRUD de rutinas |
| `/payments` | Historial de pagos |

## Gestión de Instructores

### CRUD de Instructores

Los instructores se gestionan como entidades separadas. Debes crear instructores primero antes de asignarlos a clases o rutinas.

**Página de Instructores** (pendiente de implementar en backoffice):
- Crear, editar, eliminar instructores
- Campos: nombre, email, teléfono, especialidad, biografía

### Asignar Instructores a Clases

En la página de **Clases** (`/classes`), puedes:

1. **Crear clase con instructores**: Al crear una nueva clase, selecciona 1-2 instructores de la lista.
2. **Actualizar instructores**: Edita una clase existente para cambiar o asignar instructores.
3. **Máximo 2 instructores**: Una clase puede tener 1 o 2 instructores asignados.

### Asignar Instructores a Rutinas

En la página de **Rutinas** (`/routines`), puedes:

1. **Asignar instructor opcional**: Al crear o editar una rutina, puedes asignar un instructor (opcional).
2. **Sin instructor**: Las rutinas pueden existir sin instructor asignado.

### Notas Importantes

- **Instructores separados**: Los instructores no son usuarios del sistema, son entidades independientes.
- **Sin límite de clases**: Un instructor puede tener múltiples clases asignadas sin restricción.
- **Sin validación de horarios**: El sistema no previene automáticamente que un instructor tenga clases superpuestas. Gestiona los horarios manualmente si es necesario.

## Variables de Entorno

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```
