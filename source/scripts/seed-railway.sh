#!/bin/bash

# Script para ejecutar seeders en Railway usando Railway CLI
# Requiere: railway CLI instalado y autenticado

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚂 Ejecutando seeders en Railway...${NC}"
echo ""

# Verificar que railway CLI esté instalado
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Error: Railway CLI no está instalado${NC}"
    echo ""
    echo "Instala Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Luego autentícate:"
    echo "  railway login"
    exit 1
fi

# Obtener DATABASE_URL desde Railway
echo -e "${BLUE}🔍 Obteniendo DATABASE_URL desde Railway...${NC}"
DB_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [ -z "$DB_URL" ]; then
    echo -e "${YELLOW}⚠️  No se pudo obtener DATABASE_URL automáticamente${NC}"
    echo "Intentando obtener desde Railway link..."
    
    # Intentar obtener desde el link actual
    DB_URL=$(railway run printenv DATABASE_URL 2>/dev/null | grep DATABASE_URL | cut -d'=' -f2- || echo "")
fi

if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener DATABASE_URL${NC}"
    echo ""
    echo "Opciones:"
    echo "  1. Asegúrate de estar en el proyecto correcto: railway link"
    echo "  2. Obtén DATABASE_URL manualmente y ejecuta:"
    echo "     DATABASE_URL='...' ./scripts/seed-db.sh"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL obtenido${NC}"
echo ""

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEEDERS_DIR="$SCRIPT_DIR/seeders"

# Ejecutar seeders
echo -e "${BLUE}📦 Ejecutando seed_all.sql...${NC}"
railway run psql "$DB_URL" -f "$SEEDERS_DIR/seed_all.sql"
echo -e "${BLUE}📦 Ejecutando 06_full_demo.sql...${NC}"
railway run psql "$DB_URL" -f "$SEEDERS_DIR/06_full_demo.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Seeders ejecutados exitosamente en Railway${NC}"
    echo ""
    echo -e "${GREEN}Credenciales por defecto:${NC}"
    echo "  Admin: admin@boxmagic.cl / admin123"
    echo "  User:  user@boxmagic.cl / user123"
else
    echo ""
    echo -e "${RED}❌ Error al ejecutar seeders${NC}"
    exit 1
fi
