FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port (change if your app uses a different port)
EXPOSE 3009

# Run as non-root user for security
USER node

# Use wait-for-it.sh to wait for Cassandra before starting the service.
# Start the service. Waiting is now handled by the docker-compose healthcheck dependency.
CMD ["node", "src/app.js"]