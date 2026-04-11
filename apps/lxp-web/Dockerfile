# Build context: monorepo root
#   docker build -f apps/lxp-web/Dockerfile -t lxp-web .

FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/lxp-web/package*.json ./
RUN npm ci

COPY apps/lxp-web/ ./
RUN npm run build

# --- Runtime ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
