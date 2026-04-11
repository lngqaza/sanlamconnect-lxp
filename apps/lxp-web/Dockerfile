# Build context must be the monorepo root:
#   docker build -f apps/lxp-web/Dockerfile .

FROM node:20-alpine AS builder

WORKDIR /monorepo

# Copy shared packages so @/packages/* imports resolve
COPY packages/ ./packages/

# Install dependencies
COPY apps/lxp-web/package*.json ./apps/lxp-web/
RUN cd apps/lxp-web && npm ci

# Copy source and build
COPY apps/lxp-web/ ./apps/lxp-web/
RUN cd apps/lxp-web && npm run build

# --- Runtime image ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /monorepo/apps/lxp-web/.next ./.next
COPY --from=builder /monorepo/apps/lxp-web/node_modules ./node_modules
COPY --from=builder /monorepo/apps/lxp-web/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
