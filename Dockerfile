# Runs the Express API for Cloudflare Containers. Cloudflare's Workers Static
# Assets serve client/dist directly, so this image builds the client only to
# get that output onto disk for local `docker run` parity — the container
# itself only ever serves /api/* (see worker/index.js).
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev
COPY server server
COPY --from=build /app/client/dist client/dist

RUN groupadd --system app && useradd --system --gid app app && chown -R app:app /app
USER app

EXPOSE 2000
CMD ["node", "server/src/index.js"]
