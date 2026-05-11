# GeneZap API — Render / Fly.io / generic container
# Build from repository root:  docker build -t genezap-api .
# Run:  docker run -p 8000:8000 -e GENEZAP_DATASETS_ROOT=/data/datasets -v genezap-data:/data/datasets genezap-api

FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    MALLOC_ARENA_MAX=2

WORKDIR /app

# Install backend dependencies first (layer cache).
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Install curl for GitHub model download script
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Application + hackathon model bundle (required for integrated + quad artifact paths).
COPY backend /app/backend
COPY CV_HACKATHON_MODEL_DATASET /app/CV_HACKATHON_MODEL_DATASET
COPY data/datasets/pools/default-public-pool /app/bootstrap_data/datasets/pools/default-public-pool

# Download model initialization script (for GitHub Releases auto-download on startup).
RUN chmod +x /app/backend/download_models.sh /app/backend/entrypoint.sh

WORKDIR /app/backend

# Writable volume default for dataset pools + batch jobs (override in orchestrator).
RUN mkdir -p /data/datasets
ENV GENEZAP_DATASETS_ROOT=/data/datasets \
    GENEZAP_PUBLIC_DATASET_SEED_ROOT=/app/bootstrap_data/datasets \
    GENEZAP_CV_ARTIFACT_ROOT=/app/CV_HACKATHON_MODEL_DATASET \
    GENEZAP_ENV=production

EXPOSE 8000

# Render sets PORT; Fly.io uses 8080 internally — honor PORT first.
# On startup: seed the public pool if needed, download models from GitHub releases, then start Uvicorn.
CMD ["/app/backend/entrypoint.sh"]
