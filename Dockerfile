# Multi-stage Dockerfile for Vortex Client (Frontend)
# Builds the React app and serves via Vite preview server

# ============================================
# Builder Stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 vortex

# Copy built assets from builder
COPY --from=builder --chown=vortex:nodejs /app/dist ./dist
COPY --from=builder --chown=vortex:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=vortex:nodejs /app/package.json ./package.json
COPY --from=builder --chown=vortex:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=vortex:nodejs /app/public ./public

# Switch to non-root user
USER vortex

# Expose port (Vite preview default)
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Start the preview server
CMD ["npm", "run", "preview"]
