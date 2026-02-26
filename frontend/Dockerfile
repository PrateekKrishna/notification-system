# ===== BUILD STAGE =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy from frontend/ subdir since Railway build context is repo root
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# Build with placeholder URLs — they get replaced at container startup
# .env.production contains __VITE_USER_PREF_API_URL__ etc. as placeholders
RUN npm run build

# ===== FINAL STAGE — serve with nginx =====
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script that replaces placeholder URLs with real env vars
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Entrypoint replaces __VITE_*__ placeholders then starts nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
