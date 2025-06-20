#!/bin/bash
# Entrypoint script: run wasmd node, nodeinfo REST API, and deploy smart contracts

# Print what we're doing for debugging
echo "Starting wasmd node and nodeinfo REST API..."

# Start wasmd node (Cosmos SDK) in background
wasmd start &
WASMD_PID=$!

# Give wasmd a moment to start before launching the REST API
sleep 5

# Start REST API nodeinfo on port 1318 in background
nodeinfo-rest &
REST_PID=$!

# Print status
echo "wasmd node started with PID: $WASMD_PID"
echo "REST API started with PID: $REST_PID"
echo "Services are now running..."

# Function to handle container shutdown
function handle_shutdown {
    echo "Received shutdown signal, gracefully stopping services..."
    
    # Kill REST API first
    if kill -TERM $REST_PID 2>/dev/null; then
        echo "Sent TERM signal to REST API (PID: $REST_PID)"
        wait $REST_PID 2>/dev/null || true
    else
        echo "REST API is already stopped"
    fi
    
    # Then kill wasmd
    if kill -TERM $WASMD_PID 2>/dev/null; then
        echo "Sent TERM signal to wasmd (PID: $WASMD_PID)"
        wait $WASMD_PID 2>/dev/null || true
    else
        echo "wasmd is already stopped"
    fi
    
    echo "All services stopped gracefully"
    exit 0
}

# Setup signal handler to properly terminate child processes
trap handle_shutdown SIGTERM SIGINT

# Monitor both processes and exit if either one exits
while true; do
    # Check if wasmd is running
    if ! ps -p $WASMD_PID > /dev/null; then
        echo "wasmd process exited unexpectedly with PID: $WASMD_PID"
        # Kill REST API
        kill -TERM $REST_PID 2>/dev/null || true
        exit 1
    fi
    
    # Check if REST API is running
    if ! ps -p $REST_PID > /dev/null; then
        echo "REST API process exited unexpectedly with PID: $REST_PID"
        # Kill wasmd
        kill -TERM $WASMD_PID 2>/dev/null || true
        exit 1
    fi
    
    # Sleep for a bit before checking again
    sleep 5
done
