# Dockerfile for Mor'ia MMO — works with Fly.io, Railway, etc.
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install root deps (for building client) and server deps
RUN npm install
RUN cd server && npm install

# Copy source and build client
COPY . .
RUN npm run build

# Expose port (Render/Fly set PORT env automatically)
ENV PORT=3000
EXPOSE 3000

# Start server (serves client + WebSocket)
CMD ["node", "server/server.js"]
