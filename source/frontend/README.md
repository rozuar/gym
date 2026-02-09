# Frontend Web - Box Magic

Aplicación web para usuarios.

## Stack
- Next.js 14
- TypeScript
- Tailwind CSS

## Setup

```bash
npm install
npm run dev
```

Puerto: 3000

## Estructura

```
src/
├── app/
│   ├── layout.tsx       # Layout principal
│   ├── page.tsx         # Home
│   ├── login/           # Login
│   ├── register/        # Registro
│   ├── schedule/        # Horarios y reservas
│   ├── bookings/        # Mis reservas
│   ├── results/         # Mis resultados de rutinas
│   ├── profile/         # Mi perfil
│   └── plans/           # Planes
├── components/
│   ├── layout/          # Navbar, etc.
│   └── ui/              # Button, Input, Card
├── contexts/
│   └── AuthContext.tsx  # Autenticación
├── lib/
│   └── api.ts           # Cliente API
└── types/
    └── index.ts         # Tipos TypeScript
```

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Home |
| `/login` | Iniciar sesión |
| `/register` | Crear cuenta |
| `/schedule` | Ver horarios y reservar |
| `/bookings` | Ver y cancelar reservas |
| `/results` | Ver, registrar, editar y eliminar resultados de rutinas |
| `/profile` | Perfil y suscripción |
| `/plans` | Ver y comprar planes |

## Variables de Entorno

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```
