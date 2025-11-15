# Development Dockerfile for Backend
FROM node:20-alpine

# Install OpenSSL, build tools, and required libraries for Prisma and bcrypt
RUN apk add --no-cache openssl libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client  
RUN npx prisma generate

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 8000-8100

# Start development server
CMD ["npm", "run", "dev"]
