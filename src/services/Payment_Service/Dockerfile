FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY package*.json ./

# Install all dependencies (incl. devDependencies) for build
RUN npm install

# Copy rest of the app
COPY . .

# Build the TypeScript app (assumes tsc is configured)
RUN npm run build

# Remove dev dependencies to keep image size small (optional but recommended)
RUN npm prune --production

# Expose port
EXPOSE 3003

# Run as non-root user
USER node

# Start app
CMD ["npm", "start"]
