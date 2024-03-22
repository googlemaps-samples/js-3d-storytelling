#!/bin/bash

# Purpose:
#  This script sets up a temporary working environment, copies project files,
#  updates configuration, and starts an HTTP server using npx http-server.
#
# Usage: 
#  ./run_server.sh [optional_port] [optional_api_key]
#
#  - optional_port: The port you wish the server to run on. Defaults to 5500.
#  - optional_api_key: Your API key. Can also be provided as an environment variable 'API_KEY'.

# --- Start of Script ---

# Check for required Node.js and npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
  echo "Node.js and npm are required. Please install them."
  exit 1
fi

# Set default port and handle optional port argument
DEFAULT_PORT=5500
PORT=${1:-$DEFAULT_PORT}  

# Retrieve API Key (check environment variable first, then arguments)
API_KEY=${API_KEY:-$2} 

if [[ -z "$API_KEY" ]]; then
  echo "Error: API key missing. Please provide it as an environment variable (API_KEY) or argument."
  exit 1
fi

# Create a temporary working directory
WORKDIR=$(mktemp -d)
echo "Temporary working directory created at: $WORKDIR"

# Define function to clean up the temporary directory on script exit
function cleanup {
  rm -rf "$WORKDIR"
  echo "Temporary working directory removed: $WORKDIR"
}
trap cleanup EXIT 

# Copy source and demo files into temp WORKDIR (adjust paths as needed)
cp -r ./src/* "$WORKDIR" 
cp -r ./demo/src "$WORKDIR/demo"

cd "$WORKDIR" || exit 1 # Move into the WORKDIR
echo "Changed directory to: $WORKDIR"

# API Key replacement in 'env.js' (assuming it's in the root)
cp env.example.js env.js
sed -i -r "s/<API_KEY>/${API_KEY}/g" env.js
echo "API key updated in env.js"

# Modify index.html (assuming it's in the top level of WORKDIR)
sed -i -r "s/main.js/demo\/sidebar.js/g" index.html
echo "index.html modified"

# Start the server using npx (no need for pre-installation)
echo "Starting server on port $PORT..."
npx http-server -p "$PORT" . 
