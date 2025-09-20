#!/bin/bash

# Check if render-env.json exists (this would be downloaded from Render's dashboard)
if [ ! -f "render-env.json" ]; then
    echo "Error: render-env.json not found!"
    echo "Please download your environment variables from Render dashboard and save them as render-env.json"
    exit 1
fi

# Convert JSON to env file format
echo "Converting Render environment variables to .env format..."
jq -r 'to_entries | .[] | .key + "=" + .value' render-env.json > .env.render

# Merge with existing .env file if it exists
if [ -f ".env" ]; then
    echo "Existing .env file found. Creating backup..."
    cp .env .env.backup
fi

# Copy render env to .env
cp .env.render .env

echo "Environment variables have been set up successfully!"
echo "A backup of your previous .env file has been saved as .env.backup (if it existed)"
echo ""
echo "You can now run: docker-compose up -d"