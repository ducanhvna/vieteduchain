#!/bin/bash
# Script to fix the Go REST API issues

# Define colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== Fixing Go REST API Issues =====${NC}"

# Set directory paths
CHAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../chain" && pwd)"
BACKUP_DIR="${CHAIN_DIR}/backup"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if Go version is compatible with the new router syntax
GO_VERSION=$(go version | grep -o 'go[0-9]\+\.[0-9]\+\(\.[0-9]\+\)*' | cut -c 3-)
MAJOR_VERSION=$(echo "$GO_VERSION" | cut -d. -f1)
MINOR_VERSION=$(echo "$GO_VERSION" | cut -d. -f2)

echo -e "${YELLOW}Detected Go version: ${GO_VERSION}${NC}"

# Check if we need to use the compatibility version
USE_COMPAT=false
if [ "$MAJOR_VERSION" -lt 1 ] || { [ "$MAJOR_VERSION" -eq 1 ] && [ "$MINOR_VERSION" -lt 22 ]; }; then
    echo -e "${YELLOW}Go version is < 1.22, using compatibility version with gorilla/mux router${NC}"
    USE_COMPAT=true
fi

# Backup current main.go
echo -e "${YELLOW}Backing up current main.go to ${BACKUP_DIR}/main.go.backup${NC}"
cp "${CHAIN_DIR}/main.go" "${BACKUP_DIR}/main.go.backup"

if [ "$USE_COMPAT" = true ]; then
    # Check if gorilla/mux is installed
    if ! go list -m github.com/gorilla/mux &> /dev/null; then
        echo -e "${YELLOW}Installing gorilla/mux router...${NC}"
        cd "${CHAIN_DIR}" && go get github.com/gorilla/mux
        go mod tidy
    fi
    
    # Copy the compatibility version
    echo -e "${YELLOW}Using compatibility version of main.go${NC}"
    cp "$(dirname "${BASH_SOURCE[0]}")/main.go.compatible" "${CHAIN_DIR}/main.go"
else
    echo -e "${GREEN}Go version is >= 1.22, no need for compatibility fixes${NC}"
fi

# Make sure go.mod has the local replace directive
cd "${CHAIN_DIR}"
if ! grep -q "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" go.mod; then
    echo -e "${YELLOW}Adding module replacement to go.mod${NC}"
    echo "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" >> go.mod
    go mod tidy
fi

echo -e "${GREEN}Go REST API fix completed!${NC}"
echo -e "${YELLOW}Now restart your container with ./run_allinone.sh${NC}"
