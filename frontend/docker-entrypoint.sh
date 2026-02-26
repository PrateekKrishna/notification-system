#!/bin/sh
# At container startup, replace placeholder strings in the built JS bundle
# with actual values from Railway environment variables.

USER_PREF_URL="${VITE_USER_PREF_API_URL:-http://localhost:8081}"
NOTIFICATION_URL="${VITE_NOTIFICATION_API_URL:-http://localhost:8082}"

echo "Injecting API URLs..."
echo "=== VITE env vars in container ==="
env | grep VITE || echo "(none found)"
echo "=================================="

USER_PREF_URL="${VITE_USER_PREF_API_URL:-http://localhost:8081}"
NOTIFICATION_URL="${VITE_NOTIFICATION_API_URL:-http://localhost:8082}"

echo "  USER_PREF_API: $USER_PREF_URL"
echo "  NOTIFICATION_API: $NOTIFICATION_URL"

find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
  "s|__VITE_USER_PREF_API_URL__|$USER_PREF_URL|g" {} \;

find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
  "s|__VITE_NOTIFICATION_API_URL__|$NOTIFICATION_URL|g" {} \;

echo "Done. Starting nginx..."
exec nginx -g "daemon off;"
