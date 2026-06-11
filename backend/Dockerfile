FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npx prisma generate && npm run build

EXPOSE 3333

# Aplica migrations, popula o banco de demonstração e inicia a API
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/server.js"]
