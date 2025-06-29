# First stage: build the wasmd binary
FROM golang:1.21 AS builder

# Install required tools and dependencies
RUN apt-get update && apt-get install -y \
    make \
    git \
    gcc \
    build-essential \
    libusb-1.0-0-dev \
    pkg-config \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone a CosmWasm-integrated chain like wasmd or your forked chain
RUN git clone https://github.com/CosmWasm/wasmd.git .
RUN git checkout v0.50.0  # Choose appropriate CosmWasm-supported version

# Apply the patch if it exists
COPY wasmd.patch /tmp/wasmd.patch
RUN if [ -f /tmp/wasmd.patch ]; then git apply /tmp/wasmd.patch || echo "Patch may have already been applied or doesn't apply cleanly"; fi

# Detect architecture and download the appropriate libwasmvm library
RUN ARCH=$(dpkg --print-architecture) && \
    export WASMVM_VERSION=$(go list -m github.com/CosmWasm/wasmvm | cut -d ' ' -f 2) && \
    if [ "$ARCH" = "arm64" ]; then \
        echo "Architecture: ARM64, WASMVM_VERSION: $WASMVM_VERSION" && \
        curl -L "https://github.com/CosmWasm/wasmvm/releases/download/$WASMVM_VERSION/libwasmvm.aarch64.so" -o /usr/lib/libwasmvm.so; \
    else \
        echo "Architecture: AMD64, WASMVM_VERSION: $WASMVM_VERSION" && \
        curl -L "https://github.com/CosmWasm/wasmvm/releases/download/$WASMVM_VERSION/libwasmvm.x86_64.so" -o /usr/lib/libwasmvm.so; \
    fi

# Build wasmd with proper flags for dynamic linking (removing muslc tag)
RUN CGO_ENABLED=1 go build -tags "netgo,ledger" -o build/wasmd ./cmd/wasmd

# Second stage: create a minimal runtime image with newer GLIBC
FROM debian:bookworm-slim

# Install necessary runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    bash \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Copy wasmvm library from builder
COPY --from=builder /usr/lib/libwasmvm.so /usr/lib/

# Create symlinks for ARM64 compatibility
RUN ln -sf /usr/lib/libwasmvm.so /usr/lib/libwasmvm.aarch64.so && \
    ln -sf /usr/lib/libwasmvm.so /usr/lib/libwasmvm.x86_64.so

# Ensure the binaries can find libraries at runtime
ENV LD_LIBRARY_PATH="/usr/lib"

# Copy wasmd binary
COPY --from=builder /app/build/wasmd /usr/bin/wasmd

# Copy config files if needed
COPY config/ /root/.wasmd/config/

# Set default command
ENTRYPOINT ["wasmd"]
CMD ["start"]
