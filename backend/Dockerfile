FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first to leverage Docker layer caching
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Copy remaining project files
COPY tsconfig*.json ./
COPY src ./src

# Build the application
RUN npm run build

ENV NODE_ENV=production

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
