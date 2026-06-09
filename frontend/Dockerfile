# Stage 1: Build React static assets
FROM node:18-alpine AS build
WORKDIR /app

# Copy package descriptors and lockfile
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set Vite build-time environment variable
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5000}

# Build the project
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
