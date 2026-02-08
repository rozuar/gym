# 🚀 Guía para Levantar Servicios

## Estado Actual
- ✅ PostgreSQL ya está corriendo en `localhost:5432`

## Opción 1: Script Automático (Recomendado)

```bash
# Desde la carpeta source/
./scripts/start-dev.sh
```

Este script levanta automáticamente:
1. PostgreSQL (si no está corriendo)
2. Backend API (puerto 8080)
3. Frontend (puerto 3000)
4. Backoffice (puerto 3001)

Para detener todos:
```bash
./scripts/stop-dev.sh
```

## Opción 2: Manual (Terminales Separadas)

### Terminal 1: Backend API
```bash
cd source/backend
go mod download  # Solo la primera vez
go run cmd/api/main.go
```

### Terminal 2: Frontend
```bash
cd source/frontend
npm install  # Solo la primera vez
npm run dev
```

### Terminal 3: Backoffice
```bash
cd source/backoffice
npm install  # Solo la primera vez
npm run dev -- -p 3001
```

## Verificar que Todo Esté Corriendo

```bash
# Backend
curl http://localhost:8080/health
# Debe responder: {"status":"ok"}

# Frontend
curl http://localhost:3000
# Debe responder con HTML

# Backoffice
curl http://localhost:3001
# Debe responder con HTML
```

## URLs de Acceso

| Servicio | URL |
|----------|-----|
| 🗄️ PostgreSQL | `localhost:5432` |
| 🔧 Backend API | http://localhost:8080 |
| 🌐 Frontend | http://localhost:3000 |
| 👨‍💼 Backoffice | http://localhost:3001 |

## Troubleshooting

### Puerto ya en uso
```bash
# Ver qué está usando el puerto
lsof -i :8080
lsof -i :3000
lsof -i :3001

# Detener proceso
kill -9 <PID>
```

### PostgreSQL no está corriendo
```bash
cd source/
docker-compose -f docker-compose.dev.yml up -d db
```

### Error de dependencias
```bash
# Backend
cd backend && go mod download

# Frontend/Backoffice
cd frontend && npm install
cd backoffice && npm install
```
