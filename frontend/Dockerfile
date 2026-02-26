# ===== BUILD STAGE =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy from frontend/ subdir since Railway build context is repo root
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# Build args from Railway Variables tab
ARG VITE_USER_PREF_API_URL
ARG VITE_NOTIFICATION_API_URL
# Must explicitly set as ENV so Vite can read them during npm run build
ENV VITE_USER_PREF_API_URL=$VITE_USER_PREF_API_URL
ENV VITE_NOTIFICATION_API_URL=$VITE_NOTIFICATION_API_URL

RUN npm run build

# ===== FINAL STAGE — serve with nginx =====
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config from repo (build context is repo root)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
