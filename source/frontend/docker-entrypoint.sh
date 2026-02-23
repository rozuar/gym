#!/bin/sh
if [ -z "$BACKEND_URL" ]; then
  echo "WARNING: BACKEND_URL not set, API proxy disabled"
  cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
else
  envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
fi
exec nginx -g 'daemon off;'
