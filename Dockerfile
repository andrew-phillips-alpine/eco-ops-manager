# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js static export
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies and serve for fallback
RUN npm install -g serve

# Copy package files for production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy built static files
COPY --from=builder /app/out ./out

# Copy server and blocks
COPY --from=builder /app/server.js ./
COPY --from=builder /app/app/blocks ./app/blocks
COPY --from=builder /app/app/config ./app/config
COPY --from=builder /app/app/shared ./app/shared

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Default command - custom Node server
CMD ["node", "server.js"]
