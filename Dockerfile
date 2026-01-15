# # ---------- Development Dockerfile ----------
# FROM node:20-alpine

# WORKDIR /app

# # Install dependencies including devDependencies
# COPY package*.json ./
# RUN npm install

# # Copy source code
# COPY . .

# # Expose the dev port
# EXPOSE 8000

# # Run NestJS in watch mode
# CMD ["npm", "run", "start:dev"]


FROM node:20-alpine

WORKDIR /app

# Install production deps only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled output
COPY dist ./dist

# Railway/Render will inject PORT
CMD ["node", "dist/main.js"]
