# Stage 1: Build the Vite app
FROM node:20-alpine AS builder

WORKDIR /build

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Runtime on Cloudron base with Node.js (no nginx — filesystem is read-only)
FROM cloudron/base:5.0.0@sha256:04fd70dbd8ad6149c19de39e35718e024417c3e01dc9c6637eaf4a41ec4e596c

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy built static files
RUN mkdir -p /app/code
COPY --from=builder /build/dist /app/code

# Copy production API + static server (no external dependencies)
COPY server.js /app/code/server.js

# Startup script
COPY start.sh /app/pkg/start.sh
RUN chmod +x /app/pkg/start.sh

CMD ["/app/pkg/start.sh"]
