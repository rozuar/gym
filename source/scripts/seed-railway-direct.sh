#!/bin/bash

# Script alternativo para ejecutar seeders en Railway
# Usa psql directamente con DATABASE_URL obtenido manualmente o desde Railway

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚂 Ejecutando seeders en Railway (método directo)...${NC}"
echo ""

# Obtener DATABASE_URL desde Railway variables o argumento
if [ -n "$1" ]; then
    DB_URL="$1"
    echo -e "${BLUE}📝 Usando DATABASE_URL proporcionado${NC}"
elif [ -n "$DATABASE_URL" ]; then
    DB_URL="$DATABASE_URL"
    echo -e "${BLUE}📝 Usando DATABASE_URL de variable de entorno${NC}"
else
    echo -e "${YELLOW}⚠️  DATABASE_URL no proporcionado${NC}"
    echo ""
    echo "Opciones:"
    echo "  1. Obtén DATABASE_URL desde Railway dashboard:"
    echo "     Variables > DATABASE_URL > Copy"
    echo ""
    echo "  2. Ejecuta este script con:"
    echo "     ./scripts/seed-railway-direct.sh 'postgresql://...'"
    echo ""
    echo "  3. O exporta la variable:"
    echo "     export DATABASE_URL='postgresql://...'"
    echo "     ./scripts/seed-railway-direct.sh"
    exit 1
fi

# Verificar que psql esté disponible
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql no está instalado${NC}"
    echo ""
    echo "Instala PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  Windows: descarga desde https://www.postgresql.org/download/"
    exit 1
fi

# Verificar conexión
echo -e "${BLUE}🔍 Verificando conexión...${NC}"
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se pudo conectar a la base de datos${NC}"
    echo ""
    echo "Verifica que:"
    echo "  1. La URL sea correcta"
    echo "  2. Tu IP esté permitida en Railway (si aplica)"
    echo "  3. La base de datos esté activa"
    exit 1
fi

echo -e "${GREEN}✅ Conexión exitosa${NC}"
echo ""

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEEDERS_DIR="$SCRIPT_DIR/seeders"

# Ejecutar seeders
echo -e "${BLUE}📦 Ejecutando seed_all.sql...${NC}"
psql "$DB_URL" -f "$SEEDERS_DIR/seed_all.sql"
echo -e "${BLUE}📦 Ejecutando 06_full_demo.sql...${NC}"
psql "$DB_URL" -f "$SEEDERS_DIR/06_full_demo.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Seeders ejecutados exitosamente${NC}"
    echo ""
    echo -e "${GREEN}Credenciales por defecto:${NC}"
    echo "  Admin: admin@boxmagic.cl / admin123"
    echo "  User:  user@boxmagic.cl / user123"
else
    echo ""
    echo -e "${RED}❌ Error al ejecutar seeders${NC}"
    exit 1
fi
