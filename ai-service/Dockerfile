FROM python:3.11-slim

LABEL org.opencontainers.image.title="StudyFlow AI Service" \
      org.opencontainers.image.description="AI Service API for StudyFlow AI" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Run as non-root user
RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

# Install system dependencies for build and PyMuPDF/FAISS
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Change ownership to appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8002

# STOPSIGNAL for graceful shutdown
STOPSIGNAL SIGTERM

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
