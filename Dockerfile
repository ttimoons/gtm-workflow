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

# Project files are written here. Mount a persistent volume at /app/data
# in your hosting platform (Easypanel, Cloudron, etc.) to survive container
# recreation. Without a mount, Docker creates an anonymous volume.
VOLUME ["/app/data"]

CMD ["node", "server.js"]
