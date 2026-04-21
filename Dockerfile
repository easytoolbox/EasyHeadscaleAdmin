FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:./dev.db"
ENV APP_ENCRYPTION_KEY="replace-with-a-long-random-secret-at-least-32-chars"
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"
COPY --from=builder /app ./
EXPOSE 3000
CMD ["sh", "-c", "pnpm db:deploy && pnpm start"]
