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

# Change ownership to appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

# STOPSIGNAL for graceful shutdown
STOPSIGNAL SIGTERM

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
