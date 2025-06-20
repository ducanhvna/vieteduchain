package rest

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/cosmos/cosmos-sdk/client"
)

// CredentialStatus represents the status of a verifiable credential
type CredentialStatus string

const (
	CredentialStatusActive    CredentialStatus = "active"
	CredentialStatusRevoked   CredentialStatus = "revoked"
	CredentialStatusSuspended CredentialStatus = "suspended"
	CredentialStatusExpired   CredentialStatus = "expired"
)

// VerifiableCredential represents a W3C Verifiable Credential
type VerifiableCredential struct {
	Context           []string               `json:"@context"`
	ID                string                 `json:"id"`
	Type              []string               `json:"type"`
	Issuer            string                 `json:"issuer"`
	IssuanceDate      string                 `json:"issuanceDate"`
	ExpirationDate    string                 `json:"expirationDate,omitempty"`
	CredentialSubject map[string]interface{} `json:"credentialSubject"`
	Status            CredentialStatus       `json:"status"`
	Proof             CredentialProof        `json:"proof"`
}

// CredentialProof represents the cryptographic proof of a credential
type CredentialProof struct {
	Type               string    `json:"type"`
	Created            time.Time `json:"created"`
	VerificationMethod string    `json:"verificationMethod"`
	ProofPurpose       string    `json:"proofPurpose"`
	ProofValue         string    `json:"proofValue"`
}

// CredentialVerificationRequest represents a request to verify a credential
type CredentialVerificationRequest struct {
	CredentialID string `json:"credential_id"`
}

// CredentialVerificationResponse represents the response to a credential verification
type CredentialVerificationResponse struct {
	Valid         bool             `json:"valid"`
	Status        CredentialStatus `json:"status"`
	VerifiedAt    string           `json:"verified_at"`
	IssuedBy      string           `json:"issued_by"`
	SubjectDID    string           `json:"subject_did"`
	CredentialID  string           `json:"credential_id"`
	ErrorMessage  string           `json:"error_message,omitempty"`
}

// CredentialsHandler handles requests to retrieve credentials for a specific DID
func CredentialsHandler(cliCtx client.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get DID from query parameters
		did := r.URL.Query().Get("did")
		if did == "" {
			http.Error(w, "DID parameter is required", http.StatusBadRequest)
			return
		}

		// TODO: Query the actual contract for credentials
		// This is mock data for demo purposes
		credentials := []VerifiableCredential{
			{
				Context: []string{
					"https://www.w3.org/2018/credentials/v1",
					"https://www.w3.org/2018/credentials/examples/v1",
				},
				ID:           "http://educhain.example/credentials/3732",
				Type:         []string{"VerifiableCredential", "UniversityDegreeCredential"},
				Issuer:       "did:eduid:institution1",
				IssuanceDate: "2024-06-01T19:23:24Z",
				CredentialSubject: map[string]interface{}{
					"id":         did,
					"degree": map[string]interface{}{
						"type":       "BachelorDegree",
						"name":       "Bachelor of Science and Engineering",
						"university": "Example University",
					},
					"gpa": "3.8",
				},
				Status: CredentialStatusActive,
				Proof: CredentialProof{
					Type:               "Ed25519Signature2020",
					Created:            time.Now(),
					VerificationMethod: "did:eduid:institution1#keys-1",
					ProofPurpose:       "assertionMethod",
					ProofValue:         "z58DAdFfa9SkqZMVPxAQpic7ndSayn5DzZEFQRJWVh6E34zs2U7wZg4A4RiprUBAzpzxhgzSsUrtJAeS9vivvcPL",
				},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(credentials)
	}
}

// VerifyCredentialHandler handles credential verification requests
func VerifyCredentialHandler(cliCtx client.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only accept POST requests
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse request body
		var req CredentialVerificationRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Check if credential ID is provided
		if req.CredentialID == "" {
			http.Error(w, "Credential ID is required", http.StatusBadRequest)
			return
		}

		// TODO: Implement actual credential verification logic
		// This is mock data for demo purposes
		verificationResponse := CredentialVerificationResponse{
			Valid:        true,
			Status:       CredentialStatusActive,
			VerifiedAt:   time.Now().Format(time.RFC3339),
			IssuedBy:     "did:eduid:institution1",
			SubjectDID:   "did:eduid:student1",
			CredentialID: req.CredentialID,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(verificationResponse)
	}
}

// RevokeCredentialHandler handles credential revocation requests
func RevokeCredentialHandler(cliCtx client.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only accept POST requests
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse request body
		var req struct {
			CredentialID string `json:"credential_id"`
			Reason       string `json:"reason"`
		}
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Check if credential ID is provided
		if req.CredentialID == "" {
			http.Error(w, "Credential ID is required", http.StatusBadRequest)
			return
		}

		// TODO: Implement actual credential revocation logic
		// This is mock data for demo purposes
		response := map[string]interface{}{
			"success":       true,
			"credential_id": req.CredentialID,
			"status":        string(CredentialStatusRevoked),
			"revoked_at":    time.Now().Format(time.RFC3339),
			"reason":        req.Reason,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}
