FROM oven/bun:1.3.10 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
COPY apps/web/package.json apps/web/package.json
RUN bun install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY apps/web apps/web
RUN bun run --cwd apps/web build

FROM oven/bun:1.3.10 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public
COPY --from=builder /app/apps/web/package.json apps/web/package.json
COPY --from=builder /app/package.json package.json
COPY --from=builder /app/bun.lock bun.lock
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/apps/web/node_modules apps/web/node_modules
CMD ["bun", "run", "--cwd", "apps/web", "start"]
