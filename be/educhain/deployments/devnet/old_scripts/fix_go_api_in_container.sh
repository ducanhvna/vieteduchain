#!/bin/bash

# Script to fix Go REST API in the running container

# Define colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== Fixing Go REST API directly in container =====${NC}"

# Check if container is running
CONTAINER_RUNNING=$(docker ps -q -f name=wasm-node)
if [ -z "$CONTAINER_RUNNING" ]; then
    echo -e "${RED}Container wasm-node is not running! Please start it first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Container is running, proceeding with fix...${NC}"

# Create a temporary fix script to run inside the container
cat > /tmp/fix_api.sh << 'EOF'
#!/bin/bash

cd /chain

# Check if main.go exists
if [ ! -f "main.go" ]; then
    echo "main.go not found in /chain directory!"
    exit 1
fi

# Install gorilla/mux
echo "Installing gorilla/mux..."
if ! grep -q "github.com/gorilla/mux" go.mod; then
    go get github.com/gorilla/mux
    go mod tidy
fi

# Update main.go to use gorilla/mux
echo "Updating main.go to use gorilla/mux..."
cat > main.go << 'MAINEND'
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"time"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/client/flags"
	"github.com/gorilla/mux"
	"github.com/spf13/viper"

	rest "github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain/rest"
)

// Logger structure for JSON logging
type Logger struct {
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"`
	Message   string `json:"message"`
	Path      string `json:"path,omitempty"`
	Method    string `json:"method,omitempty"`
	RemoteIP  string `json:"remote_ip,omitempty"`
	Status    int    `json:"status,omitempty"`
	Latency   int64  `json:"latency_ms,omitempty"`
}

// JSONLogger logs requests in JSON format
func JSONLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a custom response writer to capture the status code
		ww := &ResponseWriterWrapper{ResponseWriter: w, Status: 200}
		
		// Process the request
		next.ServeHTTP(ww, r)
		
		// Calculate request duration
		duration := time.Since(start).Milliseconds()
		
		// Create log entry
		logEntry := Logger{
			Timestamp: time.Now().Format(time.RFC3339),
			Level:     "info",
			Message:   "HTTP Request",
			Path:      r.URL.Path,
			Method:    r.Method,
			RemoteIP:  r.RemoteAddr,
			Status:    ww.Status,
			Latency:   duration,
		}
		
		// Marshal to JSON and print
		jsonLog, _ := json.Marshal(logEntry)
		fmt.Println(string(jsonLog))
	})
}

// ResponseWriterWrapper wraps a response writer to capture the status code
type ResponseWriterWrapper struct {
	http.ResponseWriter
	Status int
}

// WriteHeader captures the status code before calling the underlying implementation
func (w *ResponseWriterWrapper) WriteHeader(status int) {
	w.Status = status
	w.ResponseWriter.WriteHeader(status)
}

// CORSMiddleware adds CORS headers to responses
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		// Call the next handler
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Set up Cosmos SDK client context
	viper.Set(flags.FlagChainID, "educhain")
	cliCtx := client.Context{}.WithChainID(viper.GetString(flags.FlagChainID))

	// Print startup information
	fmt.Println("[REST] Starting up REST API server...")
	fmt.Println("[REST] Running with Go version:", runtime.Version())
	fmt.Println("[REST] GOOS:", runtime.GOOS, "GOARCH:", runtime.GOARCH)

	// Create router using gorilla/mux for better compatibility
	router := mux.NewRouter()
	
	// Register all REST API endpoints
	registerRoutes(router, cliCtx)
	
	// Apply middleware
	handler := JSONLogger(CORSMiddleware(router))
	
	// Get port from environment variable or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "1318"
	}
	
	listenAddr := fmt.Sprintf("0.0.0.0:%s", port)
	log.Printf("[REST] Listening on %s ... (try http://localhost:%s/api/v1/nodeinfo)\n", listenAddr, port)
	
	err := http.ListenAndServe(listenAddr, handler)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// registerRoutes registers all REST API routes
func registerRoutes(router *mux.Router, cliCtx client.Context) {
	// Base info endpoints
	router.HandleFunc("/api/v1/nodeinfo", rest.NodeInfoHandler(cliCtx)).Methods("GET")
	router.HandleFunc("/api/v1/params", rest.ChainParamsHandler(cliCtx)).Methods("GET")
	
	// Validator endpoints
	router.HandleFunc("/api/v1/validators", rest.ValidatorsHandler(cliCtx)).Methods("GET")
	
	// Transaction endpoints
	router.HandleFunc("/api/v1/tx/{hash}", rest.TxByHashHandler(cliCtx)).Methods("GET")
	router.HandleFunc("/api/v1/transactions", rest.TxListHandler(cliCtx)).Methods("GET")
	
	// DID endpoints
	router.HandleFunc("/api/v1/dids", rest.DIDsListHandler(cliCtx)).Methods("GET")
	router.HandleFunc("/api/v1/dids/{id}", rest.DIDByIDHandler(cliCtx)).Methods("GET")
	
	// Credential endpoints
	router.HandleFunc("/api/v1/credentials", rest.CredentialsHandler(cliCtx)).Methods("GET")
	router.HandleFunc("/api/v1/credentials/verify", rest.VerifyCredentialHandler(cliCtx)).Methods("POST")
	router.HandleFunc("/api/v1/credentials/revoke", rest.RevokeCredentialHandler(cliCtx)).Methods("POST")
	
	// Health check endpoint
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	}).Methods("GET")
	
	// For backward compatibility
	router.HandleFunc("/nodeinfo", rest.NodeInfoHandler(cliCtx)).Methods("GET")
}
MAINEND

echo "Updated main.go successfully"

# Fix go.mod if needed
if ! grep -q "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" go.mod; then
    echo "Adding module replacement to go.mod"
    echo "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" >> go.mod
fi

echo "Killing any existing Go API processes"
pkill -f "go run main.go" || true

echo "Starting updated Go API server"
go run main.go &

echo "Fix completed!"
EOF

# Copy fix script to container
echo -e "${YELLOW}Copying fix script to container...${NC}"
docker cp /tmp/fix_api.sh wasm-node:/tmp/fix_api.sh
docker exec wasm-node chmod +x /tmp/fix_api.sh

# Run fix script in container
echo -e "${YELLOW}Running fix script in container...${NC}"
docker exec wasm-node /tmp/fix_api.sh

# Wait for API to start
echo -e "${YELLOW}Waiting for API to start...${NC}"
sleep 5

# Check if API is responding
echo -e "${YELLOW}Checking if API is responding...${NC}"
if curl -s http://localhost:1318/health > /dev/null; then
    echo -e "${GREEN}API is working! Try http://localhost:1318/health${NC}"
elif curl -s http://localhost:1318/api/v1/nodeinfo > /dev/null; then
    echo -e "${GREEN}API is working! Try http://localhost:1318/api/v1/nodeinfo${NC}"
else
    echo -e "${RED}API is still not responding. You may need to manually start it:${NC}"
    echo -e "${YELLOW}docker exec wasm-node bash -c \"cd /chain && go run main.go\"${NC}"
fi

echo -e "${GREEN}Done!${NC}"
