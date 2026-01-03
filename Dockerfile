FROM node:20-alpine

# Arbeitsverzeichnis
WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm install

# Source + Config
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build
RUN npm run build

# Production ENV
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
