FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production=false
COPY . .
RUN npm run build
ENV PORT=8000
EXPOSE 8000
CMD ["npm", "run", "start:prod"]
