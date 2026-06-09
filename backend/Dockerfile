# Use official Node.js Alpine base image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Create uploads and subdirectories to ensure permissions are correct
RUN mkdir -p uploads/invoices uploads/images

# Expose backend port
EXPOSE 5000

# Set environment variables defaults
ENV PORT=5000
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
