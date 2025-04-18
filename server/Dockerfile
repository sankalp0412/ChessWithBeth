FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    unzip \
    && wget https://stockfishchess.org/files/stockfish_12_x64_bionic.zip -O stockfish.zip \
    && unzip stockfish.zip -d /opt/stockfish \
    && rm stockfish.zip \
    && chmod +x /opt/stockfish/stockfish

# Set the STOCKFISH_PATH environment variable
ENV STOCKFISH_PATH="/opt/stockfish/stockfish"

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gcc \
    libasound2-dev \
    libportaudio2 \
    libportaudiocpp0 \
    portaudio19-dev \
    libpulse-dev \
    swig \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn app.main:app --reload --host 0.0.0.0"]
