#!/bin/bash
# Script to build and run the EduChain REST API on port 1318

# Verbose output for debugging
set -x

# Set up constants
REST_API_PORT=1318
REST_API_DIR="../../chain"
REST_API_CONTAINER="educhain-rest-api"
REST_API_IMAGE="educhain-rest-api:latest"

# Stop any existing REST API container
echo "Stopping any existing REST API containers..."
docker stop $REST_API_CONTAINER 2>/dev/null || true
docker rm $REST_API_CONTAINER 2>/dev/null || true

# Build the REST API Docker image
echo "==============================================================="
echo "Building the EduChain REST API Docker image..."
echo "==============================================================="

cat > Dockerfile.rest << 'EOT'
FROM golang:1.21-alpine AS builder

WORKDIR /goapp

COPY ./chain /goapp/chain

WORKDIR /goapp/chain

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /educhain-rest-api .

# Use a minimal alpine image for the final container
FROM alpine:3.19

# Install ca-certificates and curl for healthcheck
RUN apk --no-cache add ca-certificates curl

# Copy the binary from the builder stage
COPY --from=builder /educhain-rest-api /educhain-rest-api

EXPOSE 1318

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:1318/api/v1/nodeinfo || exit 1

CMD ["/educhain-rest-api"]
EOT

echo "Building the REST API Docker image..."
docker build -t $REST_API_IMAGE -f Dockerfile.rest ../..

# Run the REST API container
echo "==============================================================="
echo "Starting the REST API container..."
echo "==============================================================="
docker run -d \
  --name $REST_API_CONTAINER \
  -p $REST_API_PORT:1318 \
  --restart unless-stopped \
  --health-cmd "curl -f http://localhost:1318/api/v1/nodeinfo || exit 1" \
  --health-interval 30s \
  --health-timeout 3s \
  --health-start-period 5s \
  --health-retries 3 \
  $REST_API_IMAGE

# Check if container is running
if [ "$(docker ps -q -f name=$REST_API_CONTAINER)" ]; then
  echo "REST API is running at http://localhost:$REST_API_PORT/api/v1/nodeinfo"
  echo "Try the endpoints:"
  echo "  - http://localhost:$REST_API_PORT/api/v1/nodeinfo"
  echo "  - http://localhost:$REST_API_PORT/api/v1/params"
  echo "  - http://localhost:$REST_API_PORT/api/v1/validators"
  echo "  - http://localhost:$REST_API_PORT/api/v1/dids"
else
  echo "Failed to start REST API container. Check logs with: docker logs $REST_API_CONTAINER"
fi

# Check if container is running
if docker ps | grep -q $REST_API_CONTAINER; then
  echo "Success! REST API is running."
  echo "==============================================================="
  echo "REST API is running at: http://localhost:$REST_API_PORT"
  echo "To view logs: docker logs -f $REST_API_CONTAINER"
  echo "To stop container: docker stop $REST_API_CONTAINER"
else
  echo "Error: REST API container failed to start. Checking logs..."
  docker logs $REST_API_CONTAINER 2>/dev/null || echo "No logs available, container may have failed to start"
  docker ps -a | grep $REST_API_CONTAINER || echo "Container not found in any state"
  exit 1
fi
