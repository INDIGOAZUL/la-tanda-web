# =============================================================================
# Tiny Prometheus exporter that polls the Cosmos SDK REST API for data the
# CometBFT instrumentation port does not expose:
#   * validator jail status + signing-info
#   * active governance proposals
#   * staking pool stats
#   * network block height (for lag detection)
# =============================================================================
FROM python:3.12.5-alpine3.20

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN addgroup -S exporter && adduser -S -G exporter exporter

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY exporter.py ./

USER exporter

EXPOSE 9101

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:9101/health || exit 1

ENTRYPOINT ["python", "-u", "exporter.py"]
