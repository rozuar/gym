#!/bin/bash

# Script para levantar todos los servicios: BD, Backend, Frontend y Backoffice

set -e

echo "🚀 Iniciando todos los servicios de Box Magic..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si existe .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No existe archivo .env, creando desde .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Archivo .env creado. Ajusta las variables si es necesario.${NC}"
    echo ""
fi

# 1. Levantar Base de Datos
echo -e "${BLUE}📦 Paso 1/4: Iniciando PostgreSQL...${NC}"
docker-compose -f docker-compose.dev.yml up -d db

# Esperar a que PostgreSQL esté listo
echo -e "${BLUE}⏳ Esperando a que PostgreSQL esté listo...${NC}"
until docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✅ PostgreSQL listo${NC}"
echo ""

# 2. Levantar Backend API
echo -e "${BLUE}🔧 Paso 2/4: Iniciando Backend API...${NC}"
cd backend
if [ ! -d "vendor" ] && [ -f "go.mod" ]; then
    echo "📥 Descargando dependencias de Go..."
    go mod download
fi
echo "🚀 Iniciando servidor backend..."
go run cmd/api/main.go &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend API iniciado (PID: $BACKEND_PID)${NC}"
echo ""

# Esperar un poco para que el backend inicie
sleep 3

# 3. Levantar Frontend
echo -e "${BLUE}🌐 Paso 3/4: Iniciando Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependencias de Frontend..."
    npm install
fi
echo "🚀 Iniciando servidor frontend..."
npm run dev &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
echo ""

# 4. Levantar Backoffice
echo -e "${BLUE}👨‍💼 Paso 4/4: Iniciando Backoffice...${NC}"
cd backoffice
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependencias de Backoffice..."
    npm install
fi
echo "🚀 Iniciando servidor backoffice..."
npm run dev -- -p 3001 &
BACKOFFICE_PID=$!
cd ..
echo -e "${GREEN}✅ Backoffice iniciado (PID: $BACKOFFICE_PID)${NC}"
echo ""

# Guardar PIDs en archivo para poder detenerlos después
echo "$BACKEND_PID" > .pids.txt
echo "$FRONTEND_PID" >> .pids.txt
echo "$BACKOFFICE_PID" >> .pids.txt

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Todos los servicios están corriendo${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "📍 URLs disponibles:"
echo "   🗄️  PostgreSQL:  localhost:5432"
echo "   🔧 Backend API:   http://localhost:8080"
echo "   🌐 Frontend:      http://localhost:3000"
echo "   👨‍💼 Backoffice:    http://localhost:3001"
echo ""
echo "📋 Para detener todos los servicios:"
echo "   ./scripts/stop-all.sh"
echo ""
echo "📋 Para ver logs:"
echo "   Backend:    cd backend && go run cmd/api/main.go"
echo "   Frontend:   cd frontend && npm run dev"
echo "   Backoffice: cd backoffice && npm run dev -- -p 3001"
echo ""
