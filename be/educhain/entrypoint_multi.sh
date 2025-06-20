#!/bin/bash
# Entrypoint script: run both wasmd and nodeinfo REST API in background

# Start wasmd node (Cosmos SDK)
wasmd start &
WASMD_PID=$!

# Start REST API nodeinfo trên port 1318
nodeinfo-rest &
REST_PID=$!

# Wait for both processes
wait $WASMD_PID
wait $REST_PID
