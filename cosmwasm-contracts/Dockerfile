# Dockerfile for building all CosmWasm contracts and exporting .wasm files
FROM rust:latest AS builder
# TODO: Cân nhắc chỉ định phiên bản rust cụ thể và cập nhật thường xuyên để giảm lỗ hổng bảo mật

WORKDIR /code

# Copy all contract source code
COPY . .

# Install wasm target
RUN rustup target add wasm32-unknown-unknown

# Build all contracts (each contract should have its own Cargo.toml)
RUN for dir in cosmwasm-contracts/*/; do \
    if [ -f "$dir/Cargo.toml" ]; then \
      cargo build --release --target wasm32-unknown-unknown --manifest-path "$dir/Cargo.toml"; \
    fi; \
done

# Copy all .wasm files to artifacts folders
RUN for dir in cosmwasm-contracts/*/; do \
    pkg=$(basename "$dir"); \
    wasm_path="/code/target/wasm32-unknown-unknown/release/${pkg}.wasm"; \
    artifact_dir="$dir/artifacts"; \
    if [ -f "$wasm_path" ]; then \
      mkdir -p "$artifact_dir"; \
      cp "$wasm_path" "$artifact_dir/${pkg}.wasm"; \
    fi; \
done

# Final image (optional, if you want a minimal image with only artifacts)
FROM alpine:3.18
# TODO: Cân nhắc cập nhật base image lên phiên bản mới hơn khi có thể để giảm lỗ hổng bảo mật
WORKDIR /artifacts
COPY --from=builder /code/cosmwasm-contracts/*/artifacts/*.wasm ./
