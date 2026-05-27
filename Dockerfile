FROM node:20-alpine

WORKDIR /app

# Instala dependências do backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Instala e builda o frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build \
  && mkdir -p ../backend/public \
  && cp -r dist/* ../backend/public/

# Copia código do backend
COPY backend/ ./backend/

EXPOSE 3000

CMD node backend/src/config/migrate.js && node backend/src/config/seed.js && node backend/src/server.js
