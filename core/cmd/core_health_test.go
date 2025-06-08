package main

import (
	"net/http"
	"testing"
)

func TestCoreStatus(t *testing.T) {
	resp, err := http.Get("http://localhost:26657/status")
	if err != nil {
		t.Fatalf("Failed to connect to core REST: %v", err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
	}
}
