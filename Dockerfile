FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/trees.db

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/shared ./shared

RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

EXPOSE 3001

CMD ["node", "dist-server/api/index.js"]
