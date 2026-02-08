#!/bin/bash

# Script simplificado para desarrollo local
# Levanta BD, Backend, Frontend y Backoffice

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Iniciando servicios de Box Magic...${NC}"
echo ""

# Verificar .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Creando .env desde .env.example...${NC}"
    cp .env.example .env
    # Actualizar valores por defecto
    sed -i 's|DATABASE_URL=postgresql://user:password@localhost:5432/boxmagic|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/boxmagic?sslmode=disable|' .env
    sed -i 's|JWT_SECRET=your-secret-key-here|JWT_SECRET=dev-secret-change-in-production|' .env
fi

# 1. PostgreSQL
echo -e "${BLUE}📦 Iniciando PostgreSQL...${NC}"
docker-compose -f docker-compose.dev.yml up -d db
sleep 3
until docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✅ PostgreSQL listo${NC}"
echo ""

# 2. Backend
echo -e "${BLUE}🔧 Iniciando Backend API...${NC}"
cd backend
if ! command -v go &> /dev/null; then
    echo -e "${YELLOW}⚠️  Go no está instalado${NC}"
    exit 1
fi
go mod download 2>/dev/null || true
echo "Iniciando en http://localhost:8080"
go run cmd/api/main.go &
echo $! > ../.backend.pid
cd ..
sleep 2
echo -e "${GREEN}✅ Backend iniciado${NC}"
echo ""

# 3. Frontend
echo -e "${BLUE}🌐 Iniciando Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install
fi
npm run dev &
echo $! > ../.frontend.pid
cd ..
sleep 2
echo -e "${GREEN}✅ Frontend iniciado${NC}"
echo ""

# 4. Backoffice
echo -e "${BLUE}👨‍💼 Iniciando Backoffice...${NC}"
cd backoffice
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install
fi
npm run dev -- -p 3001 &
echo $! > ../.backoffice.pid
cd ..
sleep 2
echo -e "${GREEN}✅ Backoffice iniciado${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Todos los servicios están corriendo${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "📍 URLs:"
echo "   🗄️  PostgreSQL:  localhost:5432"
echo "   🔧 Backend API:   http://localhost:8080"
echo "   🌐 Frontend:      http://localhost:3000"
echo "   👨‍💼 Backoffice:    http://localhost:3001"
echo ""
echo "Para detener: ./scripts/stop-dev.sh"
echo ""
