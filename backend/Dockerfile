# Dockerfile for deploying the NestJS backend to Koyeb as a Docker service
FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies separately to leverage Docker layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the NestJS project
RUN npm run build

ENV PORT=8000
EXPOSE 8000

CMD ["npm", "run", "start:prod"]
