package main

import (
	"log"
	"net/http"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/client/flags"
	"github.com/spf13/viper"

	rest "github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain/rest"
)

func main() {
	// Set up Cosmos SDK client context (minimal for demo; adjust as needed)
	viper.Set(flags.FlagChainID, "educhain")
	cliCtx := client.Context{}.WithChainID(viper.GetString(flags.FlagChainID))

	http.HandleFunc("/nodeinfo", rest.NodeInfoHandler(cliCtx))

	log.Println("[REST] Listening on :1318 ... (try http://localhost:1318/nodeinfo)")
	err := http.ListenAndServe(":1318", nil)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
