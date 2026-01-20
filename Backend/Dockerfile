# ---------- Stage 1: Install production dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Stage 2: Runtime ----------
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy app source
COPY . .

# Create sqlite data directory & fix permissions
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 8082

CMD npm start
