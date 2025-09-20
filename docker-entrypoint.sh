#!/bin/bash
set -e

# Load .env if present without overwriting existing env vars
if [ -f /app/.env ]; then
  echo "Found /app/.env — loading environment variables"
  # shellcheck disable=SC1090
  while IFS='=' read -r key val; do
    # skip comments and blank lines
    if [[ "$key" =~ ^# ]] || [[ -z "$key" ]]; then
      continue
    fi
    # trim possible surrounding quotes
    val="$(echo "$val" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
    # only export if not already set
    if [ -z "${!key:-}" ]; then
      export "$key"="$val"
    fi
  done < /app/.env
fi

# Try to download model if requested
if [ -x /usr/local/bin/download-model.sh ]; then
  /usr/local/bin/download-model.sh || echo "download-model.sh failed or skipped"
fi

# Start the application
exec "$@"
#!/usr/bin/env bash
set -euo pipefail

# If a .env file exists at /app/.env, load variables from it but do not override
# any environment variables that are already set (container envs take precedence).
ENV_FILE=/app/.env
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE (without overriding existing env vars)..."
  # Read file line by line
  while IFS='=' read -r key val; do
    # Trim whitespace
    key="$(echo "$key" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    # Skip empty lines and comments
    if [ -z "$key" ] || [[ "$key" == \#* ]]; then
      continue
    fi
    # Remove possible quotes around the value
    val="$(echo "$val" | sed -e 's/^\s*"//' -e 's/"\s*$//' -e "s/^\s*'//" -e "s/'\s*$//")"
    # Only export if not already set
    if [ -z "${!key:-}" ]; then
      export "$key=$val"
      echo "  set $key from .env"
    else
      echo "  keep existing $key (not overridden)"
    fi
  done < <(grep -v '^\s*$' "$ENV_FILE" | grep -v '^\s*#')
else
  echo "No /app/.env file found - skipping .env load"
fi

# Run download-model script (if present); ignore errors if script missing
if [ -x "/usr/local/bin/download-model.sh" ]; then
  /usr/local/bin/download-model.sh || true
elif [ -x "./download-model.sh" ]; then
  ./download-model.sh || true
else
  echo "No download-model.sh found; skipping model download"
fi

# Exec the provided CMD
exec "$@"
