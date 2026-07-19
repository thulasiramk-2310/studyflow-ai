FROM python:3.11-slim

LABEL org.opencontainers.image.title="StudyFlow AI Service" \
      org.opencontainers.image.description="AI Service API for StudyFlow AI" \
      org.opencontainers.image.version="1.0.0"

# Bake the HuggingFace cache into the image at a stable, app-owned location.
# (Previously the cache resolved to the appuser's /nonexistent home dir at
# runtime, so the embedding model download failed with a PermissionError and
# broke all indexing / RAG / quiz / flashcard generation.)
ENV HF_HOME=/app/hf_cache

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

# Pre-download the embedding model at build time so it is baked into the image.
# This eliminates the fragile runtime download that was failing in ECS.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy source code
COPY . .

# Change ownership to appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8002

# STOPSIGNAL for graceful shutdown
STOPSIGNAL SIGTERM

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
