FROM nginx:1.25.4-alpine

LABEL org.opencontainers.image.title="StudyFlow AI API Gateway" \
      org.opencontainers.image.description="Nginx API Gateway for StudyFlow AI" \
      org.opencontainers.image.version="1.0.0"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 8000
EXPOSE 8000

# Nginx handles PID 1 gracefully, but we can explicitly define STOPSIGNAL
STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
