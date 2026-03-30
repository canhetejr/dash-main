# syntax=docker/dockerfile:1

FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_OPTIONS="--max_old_space_size=1024"
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set correct permissions for standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next-prod/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next-prod/static ./.next-prod/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]

