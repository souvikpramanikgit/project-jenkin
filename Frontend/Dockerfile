FROM node:22-alpine
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files
COPY . .

# Expose port
EXPOSE 3000

# Start in development mode (not optimized for production)
CMD npm start
