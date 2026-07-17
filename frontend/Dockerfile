# Stage 1: Build the React application
FROM node:20-slim AS builder

LABEL org.opencontainers.image.title="StudyFlow AI Frontend" \
      org.opencontainers.image.description="React frontend for StudyFlow AI" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="StudyFlow"

WORKDIR /app

# Install dependencies first for caching
COPY package.json package-lock.json ./
RUN rm package-lock.json && npm install

# Copy source and build
COPY . .
# You can pass VITE_API_URL via build args if needed
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25.4-alpine

LABEL org.opencontainers.image.title="StudyFlow AI Frontend Server" \
      org.opencontainers.image.description="Nginx server for StudyFlow AI frontend" \
      org.opencontainers.image.version="1.0.0"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Nginx handles PID 1 gracefully, but we can explicitly define STOPSIGNAL
STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
