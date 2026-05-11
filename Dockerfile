# Stage 1: Build the Vite app
FROM node:20-alpine AS builder

WORKDIR /build

COPY . .
RUN npm ci
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy built static files
COPY --from=builder /build/dist ./dist

# Copy production server + modules
COPY server.js gdrive.js auth.js ./

# Install runtime deps (googleapis only — server.js has no other npm imports)
RUN echo '{"type":"module","dependencies":{"googleapis":"^144.0.0"}}' > package.json \
 && npm install --omit=dev --no-audit --no-fund

EXPOSE 3000

# Required env vars at runtime: AUTH_SECRET, AUTH_GOOGLE_CLIENT_ID,
# AUTH_GOOGLE_CLIENT_SECRET, AUTH_REDIRECT_URI, VITE_GOOGLE_CLIENT_ID
# (set these in your hosting platform's env config)

CMD ["node", "server.js"]
