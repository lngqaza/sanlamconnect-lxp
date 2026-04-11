FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml* yarn.lock* npm-shrinkwrap.json* ./

RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

COPY . .

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["npm", "run", "start"]