# --- Stage 1: build the React frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
# Vite is configured to output straight into ../backend/public

# --- Stage 2: backend runtime ---
FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/backend/public ./public

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
