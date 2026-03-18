# Stage 1: Build the Vite app
FROM node:20-alpine AS builder

WORKDIR /build

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy built static files
COPY --from=builder /build/dist ./dist

# Copy production server
COPY server.js ./
# Minimal package.json so Node treats server.js as ESM
RUN echo '{"type":"module"}' > package.json

EXPOSE 3000

CMD ["node", "server.js"]
