#!/bin/bash

# Script para crear datos iniciales

API_URL=${API_URL:-"http://localhost:8080/api/v1"}

echo "🌱 Creando datos iniciales..."

# Crear usuario admin
echo "👤 Creando usuario admin..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@boxmagic.cl",
    "password": "admin123",
    "name": "Administrador"
  }' > /dev/null

# Login para obtener token (necesitamos actualizar el rol manualmente en la BD)
echo "⚠️  IMPORTANTE: Ejecuta en PostgreSQL para hacer admin:"
echo "   UPDATE users SET role = 'admin' WHERE email = 'admin@boxmagic.cl';"
echo ""

# Obtener token
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@boxmagic.cl", "password": "admin123"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener token"
  exit 1
fi

echo "🏋️ Creando disciplinas..."
curl -s -X POST "$API_URL/disciplines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "CrossFit", "color": "#FF6B35"}' > /dev/null

curl -s -X POST "$API_URL/disciplines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Halterofilia", "color": "#4ECDC4"}' > /dev/null

curl -s -X POST "$API_URL/disciplines" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Gimnasia", "color": "#45B7D1"}' > /dev/null

echo "💳 Creando planes..."
curl -s -X POST "$API_URL/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Plan Mensual", "price": 45000, "duration": 30, "max_classes": 0, "description": "Acceso ilimitado por 30 días"}' > /dev/null

curl -s -X POST "$API_URL/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Plan 12 Clases", "price": 35000, "duration": 30, "max_classes": 12, "description": "12 clases en 30 días"}' > /dev/null

curl -s -X POST "$API_URL/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Plan 8 Clases", "price": 28000, "duration": 30, "max_classes": 8, "description": "8 clases en 30 días"}' > /dev/null

echo "✅ Datos iniciales creados"
echo ""
echo "Credenciales admin:"
echo "  Email:    admin@boxmagic.cl"
echo "  Password: admin123"
