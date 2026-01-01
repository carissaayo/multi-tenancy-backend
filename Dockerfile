# ---------- Development Dockerfile ----------
FROM node:20-alpine

WORKDIR /app

# Install dependencies including devDependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the dev port
EXPOSE 8000

# Run NestJS in watch mode
CMD ["npm", "run", "start:dev"]
