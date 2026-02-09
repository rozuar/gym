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

### Asignar Instructores a Clases

En la página de **Clases** (`/classes`), puedes:

1. **Crear clase con instructor**: Al crear una nueva clase, selecciona un instructor de la lista de usuarios.
2. **Actualizar instructor**: Edita una clase existente para cambiar o asignar un instructor.
3. **Sin límites**: Un instructor puede tener múltiples clases asignadas sin restricción.

### Notas Importantes

- **Cualquier usuario puede ser instructor**: No hay un rol especial. Selecciona cualquier usuario de la lista.
- **Instructor opcional**: Las clases pueden existir sin instructor asignado.
- **Sin validación de horarios**: El sistema no previene automáticamente que un instructor tenga clases superpuestas. Gestiona los horarios manualmente si es necesario.

## Variables de Entorno

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```
