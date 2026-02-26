# ===== BUILD STAGE =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy from frontend/ subdir since Railway build context is repo root
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# Build the React app (VITE_* env vars are injected at build time)
ARG VITE_USER_PREF_API_URL
ARG VITE_NOTIFICATION_API_URL

RUN npm run build

# ===== FINAL STAGE — serve with nginx =====
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config to handle React Router (single page app)
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
