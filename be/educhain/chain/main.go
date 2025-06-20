package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/client/flags"
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
	// Set up Cosmos SDK client context (minimal for demo; adjust as needed)
	viper.Set(flags.FlagChainID, "educhain")
	cliCtx := client.Context{}.WithChainID(viper.GetString(flags.FlagChainID))

	// Create router
	mux := http.NewServeMux()
	
	// Register all REST API endpoints
	registerRoutes(mux, cliCtx)
	
	// Apply middleware
	handler := JSONLogger(CORSMiddleware(mux))
	
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
func registerRoutes(mux *http.ServeMux, cliCtx client.Context) {
	// Base info endpoints
	mux.HandleFunc("GET /api/v1/nodeinfo", rest.NodeInfoHandler(cliCtx))
	mux.HandleFunc("GET /api/v1/params", rest.ChainParamsHandler(cliCtx))
	
	// Validator endpoints
	mux.HandleFunc("GET /api/v1/validators", rest.ValidatorsHandler(cliCtx))
	
	// Transaction endpoints
	mux.HandleFunc("GET /api/v1/tx/{hash}", rest.TxByHashHandler(cliCtx))
	
	// DID endpoints
	mux.HandleFunc("GET /api/v1/dids", rest.DIDsListHandler(cliCtx))
	mux.HandleFunc("GET /api/v1/dids/{id}", rest.DIDByIDHandler(cliCtx))
	
	// Credential endpoints
	mux.HandleFunc("GET /api/v1/credentials", rest.CredentialsHandler(cliCtx))
	mux.HandleFunc("POST /api/v1/credentials/verify", rest.VerifyCredentialHandler(cliCtx))
	mux.HandleFunc("POST /api/v1/credentials/revoke", rest.RevokeCredentialHandler(cliCtx))
	
	// Health check endpoint
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	})
	
	// For backward compatibility
	mux.HandleFunc("GET /nodeinfo", rest.NodeInfoHandler(cliCtx))
}
