FROM node:20-bookworm-slim

WORKDIR /workspace

COPY . .

EXPOSE 3000

CMD ["sh", "-lc", "cd apps/web && ../../node_modules/.bin/next dev --hostname 0.0.0.0 --port 3000"]
