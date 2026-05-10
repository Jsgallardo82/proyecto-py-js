# Dockerfile — Backend Zitterbewegung Engine Lite v6.0
# Engine Spec v6.0 §24 (DevOps + Build)

FROM python:3.13-slim

WORKDIR /app

# Instalar dependencias del sistema (necesarias para QuTiP/SciPy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY backend/ ./backend/

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
