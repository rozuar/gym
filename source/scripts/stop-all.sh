#!/bin/bash

# Script para detener todos los servicios

echo "🛑 Deteniendo todos los servicios..."

# Detener procesos guardados en .pids.txt
if [ -f .pids.txt ]; then
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo "Deteniendo proceso $pid..."
            kill $pid 2>/dev/null || true
        fi
    done < .pids.txt
    rm .pids.txt
    echo "✅ Procesos detenidos"
fi

# Detener PostgreSQL
echo "Deteniendo PostgreSQL..."
docker-compose -f docker-compose.dev.yml down

echo "✅ Todos los servicios detenidos"
