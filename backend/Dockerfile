# ---------- Base ----------
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---------- Builder ----------
FROM base AS builder

RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY . .

ARG DATABASE_URL=postgresql://postgres:secret@postgres:5432/kuizz?schema=public
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm prisma:generate && pnpm build

# ---------- Production Dependencies ----------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --prod --frozen-lockfile

# ---------- Production ----------
FROM base AS runner
ENV NODE_ENV=production

RUN mkdir -p /home/nestjs && addgroup --system nodejs && adduser --system --ingroup nodejs --home /home/nestjs nestjs && chown -R nestjs:nodejs /home/nestjs
ENV HOME=/home/nestjs
WORKDIR /app

RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copie des fichiers nécessaires au runtime
COPY package.json pnpm-workspace.yaml ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# FIX : Chemin exact vers le script entrypoint dans le dossier backend
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

CMD ["sh", "./docker-entrypoint.sh"]