#!/bin/bash
set -euo pipefail
MODEL_PATH="/app/models/vosk-model"
DOWNLOAD="${DOWNLOAD_VOSK_MODEL:-false}"

if [ "$DOWNLOAD" = "true" ] && [ ! -d "$MODEL_PATH" ]; then
  echo "Downloading Vosk model (set DOWNLOAD_VOSK_MODEL=false to skip)..."
  mkdir -p /app/models
  cd /app/models
  wget --no-verbose https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
  unzip -q vosk-model-small-en-us-0.15.zip
  mv vosk-model-small-en-us-0.15 vosk-model
  rm -f vosk-model-small-en-us-0.15.zip
  echo "Vosk model download complete."
else
  echo "Skipping Vosk model download (already exists or not requested)"
fi
#!/usr/bin/env bash
set -euo pipefail
MODEL_PATH="/app/models/vosk-model"
DOWNLOAD="${DOWNLOAD_VOSK_MODEL:-false}"

# Only download if explicitly requested via env var
if [ "$DOWNLOAD" == "true" ] && [ ! -d "$MODEL_PATH" ]; then
  echo "Downloading Vosk model (set DOWNLOAD_VOSK_MODEL=false to skip)..."
  cd /app/models
  wget --no-verbose https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
  unzip -q vosk-model-small-en-us-0.15.zip
  mv vosk-model-small-en-us-0.15 vosk-model
  rm vosk-model-small-en-us-0.15.zip
  echo "Vosk model download complete."
else
  echo "Skipping Vosk model download (already exists or not requested)"
fi
