package rest

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/cosmos/cosmos-sdk/client"
)

type DIDDocument struct {
	ID              string    `json:"id"`
	Controller      string    `json:"controller,omitempty"`
	Type            string    `json:"type"`
	CreatedAt       string    `json:"created_at"`
	UpdatedAt       string    `json:"updated_at"`
	VerificationMethods []string  `json:"verification_methods"`
	Services        []Service `json:"services,omitempty"`
}

type Service struct {
	ID              string `json:"id"`
	Type            string `json:"type"`
	ServiceEndpoint string `json:"service_endpoint"`
}

type DIDsResponse struct {
	DIDs  []DIDDocument `json:"dids"`
	Total int           `json:"total"`
}

// Handler for /dids
func DIDsListHandler(cliCtx client.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get query parameters
		typeFilter := r.URL.Query().Get("type")
		
		// TODO: Replace with real queries to DID module or contract
		allDIDs := []DIDDocument{
			{
				ID:         "did:eduid:student1",
				Controller: "cosmos1student1...",
				Type:       "student",
				CreatedAt:  "2025-01-15T08:30:00Z",
				UpdatedAt:  "2025-01-15T08:30:00Z",
				VerificationMethods: []string{
					"did:eduid:student1#keys-1",
				},
				Services: []Service{
					{
						ID:              "did:eduid:student1#profile",
						Type:            "ProfileService",
						ServiceEndpoint: "https://educhain.example/api/profiles/student1",
					},
				},
			},
			{
				ID:         "did:eduid:institution1",
				Controller: "cosmos1institution1...",
				Type:       "institution",
				CreatedAt:  "2024-11-05T10:15:00Z",
				UpdatedAt:  "2025-03-20T14:45:00Z",
				VerificationMethods: []string{
					"did:eduid:institution1#keys-1",
					"did:eduid:institution1#keys-2",
				},
				Services: []Service{
					{
						ID:              "did:eduid:institution1#issuance",
						Type:            "CredentialIssuanceService",
						ServiceEndpoint: "https://university.example/api/credentials",
					},
				},
			},
			{
				ID:         "did:eduid:certifier1",
				Controller: "cosmos1certifier1...",
				Type:       "certifier",
				CreatedAt:  "2024-10-01T09:00:00Z",
				UpdatedAt:  "2025-02-10T11:30:00Z",
				VerificationMethods: []string{
					"did:eduid:certifier1#keys-1",
				},
				Services: []Service{
					{
						ID:              "did:eduid:certifier1#verification",
						Type:            "VerificationService",
						ServiceEndpoint: "https://certifier.example/api/verify",
					},
				},
			},
		}

		// Filter DIDs if type is provided
		filteredDIDs := allDIDs
		if typeFilter != "" {
			filteredDIDs = []DIDDocument{}
			for _, did := range allDIDs {
				if strings.EqualFold(did.Type, typeFilter) {
					filteredDIDs = append(filteredDIDs, did)
				}
			}
		}

		resp := DIDsResponse{
			DIDs:  filteredDIDs,
			Total: len(filteredDIDs),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

// Handler for /dids/{id}
func DIDByIDHandler(cliCtx client.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract DID ID from path
		didID := r.PathValue("id")
		if didID == "" {
			http.Error(w, "DID ID is required", http.StatusBadRequest)
			return
		}

		// Mock DID documents (would be replaced with actual query)
		didDocs := map[string]DIDDocument{
			"did:eduid:student1": {
				ID:         "did:eduid:student1",
				Controller: "cosmos1student1...",
				Type:       "student",
				CreatedAt:  "2025-01-15T08:30:00Z",
				UpdatedAt:  "2025-01-15T08:30:00Z",
				VerificationMethods: []string{
					"did:eduid:student1#keys-1",
				},
				Services: []Service{
					{
						ID:              "did:eduid:student1#profile",
						Type:            "ProfileService",
						ServiceEndpoint: "https://educhain.example/api/profiles/student1",
					},
				},
			},
			"did:eduid:institution1": {
				ID:         "did:eduid:institution1",
				Controller: "cosmos1institution1...",
				Type:       "institution",
				CreatedAt:  "2024-11-05T10:15:00Z",
				UpdatedAt:  "2025-03-20T14:45:00Z",
				VerificationMethods: []string{
					"did:eduid:institution1#keys-1",
					"did:eduid:institution1#keys-2",
				},
				Services: []Service{
					{
						ID:              "did:eduid:institution1#issuance",
						Type:            "CredentialIssuanceService",
						ServiceEndpoint: "https://university.example/api/credentials",
					},
				},
			},
		}

		// Check if DID exists
		didDoc, exists := didDocs[didID]
		if !exists {
			http.Error(w, "DID not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(didDoc)
	}
}
