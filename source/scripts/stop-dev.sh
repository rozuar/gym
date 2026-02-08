#!/bin/bash

echo "🛑 Deteniendo servicios..."

# Detener procesos
for pidfile in .backend.pid .frontend.pid .backoffice.pid; do
    if [ -f "$pidfile" ]; then
        pid=$(cat "$pidfile")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "Deteniendo proceso $pid..."
            kill "$pid" 2>/dev/null || true
        fi
        rm "$pidfile"
    fi
done

# Detener PostgreSQL
docker-compose -f docker-compose.dev.yml down

echo "✅ Servicios detenidos"
