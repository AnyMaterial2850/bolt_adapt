#!/bin/bash
PORT=5173 # Default Vite port

echo "Attempting to stop existing dev server on port $PORT..."

# Find PID using lsof (reliable for ports on macOS/Linux)
# -t outputs only PIDs
# -i filters for network files (specifically TCP/UDP on the port)
# Use || true to prevent script exit if lsof finds nothing
PID=$(lsof -t -i:$PORT || true)

if [ -z "$PID" ]; then
  echo "No process found listening on port $PORT."
else
  echo "Found process(es) on port $PORT with PID(s): $PID"
  echo "Stopping process(es)..."
  kill $PID
  echo "Waiting for processes to terminate..."
  sleep 2
fi

# Start the development server
echo "Starting development server..."
cd "$(dirname "$0")" && npm run dev
