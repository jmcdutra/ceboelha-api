# =============================================================================
# Ceboelha API - Dockerfile (Bun)
# =============================================================================

# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# =============================================================================
# Production stage
# =============================================================================
FROM oven/bun:1 AS runner

WORKDIR /app

# Create non-root user for security (Debian-based image)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs bunjs

# Copy from builder
COPY --from=builder --chown=bunjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bunjs:nodejs /app/src ./src
COPY --from=builder --chown=bunjs:nodejs /app/package.json ./
COPY --from=builder --chown=bunjs:nodejs /app/tsconfig.json ./

# Switch to non-root user
USER bunjs

# Expose port
EXPOSE 3333

# Health check using bun fetch
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun -e "fetch('http://localhost:3333/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["bun", "run", "src/index.ts"]
