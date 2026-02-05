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
| `/classes` | CRUD de clases |
| `/schedules` | Ver/generar horarios |
| `/routines` | CRUD de rutinas |
| `/payments` | Historial de pagos |

## Variables de Entorno

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```
