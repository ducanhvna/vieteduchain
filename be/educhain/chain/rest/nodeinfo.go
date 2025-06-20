package rest

import (
	"encoding/json"
	"net/http"

	"github.com/cosmos/cosmos-sdk/client"
)

type NodeInfoResponse struct {
	Contracts         map[string]string `json:"contracts"`
	PermissionedNodes []string          `json:"permissioned_nodes"`
	StudentDIDs       []string          `json:"student_dids"`
}

// Handler for /nodeinfo
func NodeInfoHandler(cliCtx client.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Replace with real queries to contract/module state
		contracts := map[string]string{
			"eduid":          "<eduid_contract_address>",
			"educert":        "<educert_contract_address>",
			"edupay":         "<edupay_contract_address>",
			"eduadmission":   "<eduadmission_contract_address>",
			"researchledger": "<researchledger_contract_address>",
		}
		permissionedNodes := []string{"cosmos1...", "cosmos1..."}
		studentDIDs := []string{"did:eduid:...", "did:eduid:..."}

		resp := NodeInfoResponse{
			Contracts:         contracts,
			PermissionedNodes: permissionedNodes,
			StudentDIDs:       studentDIDs,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
