
FROM node:22-bookworm-slim

WORKDIR /app

# Prisma cần OpenSSL
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cài Prisma từ package.json gốc
COPY package.json package-lock.json ./
RUN npm ci

# Cài dependencies Backend
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy Prisma schema và Backend
COPY backend/prisma ./backend/prisma
COPY backend/src ./backend/src

# Generate Prisma Client
RUN npx prisma generate --schema=backend/prisma/schema.prisma

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

WORKDIR /app/backend

CMD ["npm", "start"]
