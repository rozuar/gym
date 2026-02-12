#!/bin/bash

# Script para ejecutar seeders SQL directamente contra la base de datos
# Útil para poblar datos sin hacer deploy del backend

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Obtener DATABASE_URL desde variable de entorno o usar default local
DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/boxmagic?sslmode=disable"}

echo -e "${BLUE}🌱 Ejecutando seeders SQL...${NC}"
echo ""

# Verificar que psql esté disponible
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql no está instalado${NC}"
    echo "Instala PostgreSQL client tools para usar este script"
    exit 1
fi

# Verificar conexión a la base de datos
echo -e "${BLUE}🔍 Verificando conexión a la base de datos...${NC}"
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se pudo conectar a la base de datos${NC}"
    echo "URL: $DB_URL"
    echo ""
    echo "Asegúrate de que:"
    echo "  1. PostgreSQL esté corriendo"
    echo "  2. La base de datos exista"
    echo "  3. Las credenciales sean correctas"
    echo ""
    echo "Puedes configurar DATABASE_URL:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    exit 1
fi

echo -e "${GREEN}✅ Conexión exitosa${NC}"
echo ""

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEEDERS_DIR="$SCRIPT_DIR/seeders"

# Verificar que exista el archivo seed_all.sql
if [ ! -f "$SEEDERS_DIR/seed_all.sql" ]; then
    echo -e "${RED}❌ Error: No se encontró seed_all.sql en $SEEDERS_DIR${NC}"
    exit 1
fi

# Ejecutar seeders: base + datos de prueba completos (clases, horarios, reservas, resultados)
echo -e "${BLUE}📦 Ejecutando seed_all.sql...${NC}"
psql "$DB_URL" -f "$SEEDERS_DIR/seed_all.sql"
echo -e "${BLUE}📦 Ejecutando 06_full_demo.sql (clases, horarios, reservas, resultados)...${NC}"
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
