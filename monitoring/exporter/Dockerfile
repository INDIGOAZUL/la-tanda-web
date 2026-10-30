FROM python:3.13.15-slim-bookworm

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --require-hashes -r requirements.txt
COPY latanda_exporter.py .

USER nobody
ENTRYPOINT ["python", "-u", "/app/latanda_exporter.py"]
