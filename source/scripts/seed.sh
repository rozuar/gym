#!/bin/bash

# Script para crear datos iniciales via API
# NOTA: El backend ahora hace auto-seed al iniciar si la BD esta vacia.
#       Este script es una alternativa manual si necesitas re-crear datos.

API_URL=${API_URL:-"http://localhost:8080/api/v1"}
DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/boxmagic?sslmode=disable"}

echo "Creando datos iniciales..."

# Crear usuario admin
echo "Creando usuario admin..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@boxmagic.cl",
    "password": "admin123",
    "name": "Administrador"
  }'
echo ""

# Crear usuario regular
echo "Creando usuario regular..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@boxmagic.cl",
    "password": "user123",
    "name": "Usuario Demo"
  }'
echo ""

# Asignar rol admin via SQL
echo "Asignando rol admin..."
psql "$DB_URL" -c "UPDATE users SET role = 'admin' WHERE email = 'admin@boxmagic.cl';" 2>/dev/null

if [ $? -ne 0 ]; then
  echo "No se pudo ejecutar psql. Ejecuta manualmente:"
  echo "  UPDATE users SET role = 'admin' WHERE email = 'admin@boxmagic.cl';"
  echo ""
fi

# Obtener token admin (despues de asignar rol)
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@boxmagic.cl", "password": "admin123"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Error: No se pudo obtener token de admin"
  exit 1
fi

echo "Creando disciplinas..."
curl -s -X POST "$API_URL/disciplines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "CrossFit", "color": "#FF6B35"}'
echo ""

curl -s -X POST "$API_URL/disciplines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Halterofilia", "color": "#4ECDC4"}'
echo ""

curl -s -X POST "$API_URL/disciplines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Gimnasia", "color": "#45B7D1"}'
echo ""

echo "Creando planes..."
curl -s -X POST "$API_URL/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Plan Mensual", "price": 45000, "duration": 30, "max_classes": 0, "description": "Acceso ilimitado por 30 dias"}'
echo ""

curl -s -X POST "$API_URL/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Plan 12 Clases", "price": 35000, "duration": 30, "max_classes": 12, "description": "12 clases en 30 dias"}'
echo ""

curl -s -X POST "$API_URL/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Plan 8 Clases", "price": 28000, "duration": 30, "max_classes": 8, "description": "8 clases en 30 dias"}'
echo ""

echo ""
echo "Datos iniciales creados"
echo ""
echo "Credenciales de prueba:"
echo "  Admin:   admin@boxmagic.cl / admin123"
echo "  Usuario: user@boxmagic.cl / user123"
