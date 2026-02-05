#!/bin/bash

# Script para desarrollo local

echo "🚀 Iniciando entorno de desarrollo..."

# Iniciar PostgreSQL
echo "📦 Iniciando PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando PostgreSQL..."
sleep 3

# Verificar conexión
until docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo "✅ PostgreSQL listo"
echo ""
echo "Para iniciar los servicios:"
echo "  Backend:    cd backend && go run cmd/api/main.go"
echo "  Frontend:   cd frontend && npm run dev"
echo "  Backoffice: cd backoffice && npm run dev -- -p 3001"
echo ""
echo "URLs:"
echo "  API:        http://localhost:8080"
echo "  Frontend:   http://localhost:3000"
echo "  Backoffice: http://localhost:3001"
