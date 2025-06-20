package rest

import (
	"encoding/json"
	"net/http"

	"github.com/cosmos/cosmos-sdk/client"
)

type ChainParamsResponse struct {
	ChainID             string           `json:"chain_id"`
	BlockHeight         int64            `json:"block_height"`
	BlockTime           int              `json:"block_time_seconds"`
	MaxValidators       int              `json:"max_validators"`
	BondDenom           string           `json:"bond_denom"`
	InflationRate       string           `json:"inflation_rate"`
	CommunityTax        string           `json:"community_tax"`
	PermissionedParams  PermissionParams `json:"permissioned_params"`
	EducationalParams   EducationParams  `json:"educational_params"`
}

type PermissionParams struct {
	AllowNewValidators     bool `json:"allow_new_validators"`
	RequiredEndorsements   int  `json:"required_endorsements"`
	AllowPublicParticipation bool `json:"allow_public_participation"`
}

type EducationParams struct {
	CertificationAuthorities []string `json:"certification_authorities"`
	TrustedInstitutions      []string `json:"trusted_institutions"`
	MinEndorsersForDegree    int      `json:"min_endorsers_for_degree"`
}

// Handler for /params
func ChainParamsHandler(cliCtx client.Context) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Replace with real queries to various modules
		chainParams := ChainParamsResponse{
			ChainID:       "educhain",
			BlockHeight:   5432100,
			BlockTime:     5,
			MaxValidators: 100,
			BondDenom:     "uedu",
			InflationRate: "0.07",
			CommunityTax:  "0.02",
			PermissionedParams: PermissionParams{
				AllowNewValidators:     false,
				RequiredEndorsements:   3,
				AllowPublicParticipation: true,
			},
			EducationalParams: EducationParams{
				CertificationAuthorities: []string{
					"cosmos1authority1...",
					"cosmos1authority2...",
				},
				TrustedInstitutions: []string{
					"cosmos1uni1...",
					"cosmos1uni2...",
					"cosmos1research1...",
				},
				MinEndorsersForDegree: 2,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(chainParams)
	}
}
