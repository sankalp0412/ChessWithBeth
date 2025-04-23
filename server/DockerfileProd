FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install dependencies, Stockfish, and clean up
RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    git \
    cmake \
    gcc \
    g++ \
    make \
    libasound2-dev \
    libportaudio2 \
    libportaudiocpp0 \
    portaudio19-dev \
    libpulse-dev \
    swig \
    --no-install-recommends \
    && git clone https://github.com/official-stockfish/Stockfish.git /opt/Stockfish \
    && cd /opt/Stockfish/src \
    && make help \
    && make build ARCH=x86-64 \
    && cp ./stockfish /opt/stockfish \
    && cd / \
    && rm -rf /opt/Stockfish \
    && rm -rf /var/lib/apt/lists/*

# Set the STOCKFISH_PATH environment variable
ENV STOCKFISH_PATH="/opt/stockfish"
# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run the application using Uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --reload --host 0.0.0.0"]
