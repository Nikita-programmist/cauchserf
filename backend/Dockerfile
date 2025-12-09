# Build stage
FROM node:20-bookworm-slim AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# Production stage
FROM node:20-bookworm-slim AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
