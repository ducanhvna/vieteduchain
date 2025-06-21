#!/bin/bash
# Script to be run inside the container to install gorilla/mux and fix the API

cd /chain
go get github.com/gorilla/mux
go mod tidy

# Check if go.mod has the local replace directive
if ! grep -q "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" go.mod; then
    echo "Adding module replacement to go.mod"
    echo "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" >> go.mod
    go mod tidy
fi

# Start the REST API
go run main.go
