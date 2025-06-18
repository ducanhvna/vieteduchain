# Makefile for building the EduChain blockchain application

# Define variables
BINARY_NAME=educhain
BUILD_DIR=build
SRC_DIR=./app
PROTO_DIR=./proto
MODULES_DIR=./x

# Define the default target
all: build

# Build the application
build:
	@echo "Building the EduChain application..."
	mkdir -p $(BUILD_DIR)
	go build -o $(BUILD_DIR)/$(BINARY_NAME) $(SRC_DIR)

# Generate protobuf files
proto:
	@echo "Generating protobuf files..."
	protoc --proto_path=$(PROTO_DIR) --go_out=$(PROTO_DIR) --go-grpc_out=$(PROTO_DIR) $(PROTO_DIR)/*.proto

# Clean build artifacts
clean:
	@echo "Cleaning up build artifacts..."
	rm -rf $(BUILD_DIR)

# Run tests
test:
	@echo "Running tests..."
	go test ./...

# Install dependencies
deps:
	@echo "Installing dependencies..."
	go mod tidy

# Help message
help:
	@echo "Makefile commands:"
	@echo "  all         - Build the application"
	@echo "  build       - Build the application"
	@echo "  proto       - Generate protobuf files"
	@echo "  clean       - Clean build artifacts"
	@echo "  test        - Run tests"
	@echo "  deps        - Install dependencies"
	@echo "  help        - Show this help message"