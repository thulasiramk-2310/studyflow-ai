FROM python:3.11-slim

LABEL org.opencontainers.image.title="StudyFlow AI Study Service" \
      org.opencontainers.image.description="Study Service API for StudyFlow AI" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Run as non-root user
RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

# Install dependencies first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Change ownership to appuser. Data dirs must exist in the image so fresh
# named volumes mounted there inherit appuser ownership.
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

# STOPSIGNAL for graceful shutdown
STOPSIGNAL SIGTERM

# One worker per core: a single Python process saturated one CPU at ~340 req/s in
# the k6 load test. Each worker has its own DB pool (5 + 10 overflow), so keep
# workers x 15 under Postgres max_connections (100) together with the other services.
ENV UVICORN_WORKERS=4
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS} --proxy-headers --forwarded-allow-ips '*'"]
