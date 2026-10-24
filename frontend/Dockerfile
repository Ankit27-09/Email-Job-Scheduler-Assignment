FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Caddy serves the static build and proxies /api and /auth to the backend (see deploy/Caddyfile).
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
