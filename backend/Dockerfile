FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --production=false
RUN npm run prisma:generate

# Copy source code
COPY tsconfig*.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8000

RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
