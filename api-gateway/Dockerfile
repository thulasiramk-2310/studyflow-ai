FROM nginx:1.25.4-alpine

LABEL org.opencontainers.image.title="StudyFlow AI API Gateway" \
      org.opencontainers.image.description="Nginx API Gateway for StudyFlow AI" \
      org.opencontainers.image.version="1.0.0"

# The config is a template: the image's entrypoint runs envsubst on it at start
# and writes the result to /etc/nginx/nginx.conf. Only variables defined in the
# environment are substituted, so nginx's own $variables are left untouched.
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx     NGINX_RESOLVER=169.254.169.253
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

# Expose port 8000
EXPOSE 8000

# Nginx handles PID 1 gracefully, but we can explicitly define STOPSIGNAL
STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
