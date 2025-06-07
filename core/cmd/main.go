package main

import (
	"net/http"
	"os"

	"github.com/spf13/cobra"

	"github.com/yourusername/cosmos-permissioned-network/internal"
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "cosmos-permissioned-network",
		Short: "Cosmos Permissioned Network App",
	}

	// Add a minimal start command for Cosmos SDK v0.50.x wiring
	startCmd := &cobra.Command{
		Use:   "start",
		Short: "Start the Cosmos Permissioned Network node",
		RunE: func(cmd *cobra.Command, args []string) error {
			// Call the app wiring (currently a stub)
			_, err := internal.NewApp(cmd.Context())
			if err != nil {
				return err
			}
			// TODO: Add actual node start logic here
			cmd.Println("Node started (stub, implement actual logic)")
			go func() {
				http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Content-Type", "application/json")
					w.Write([]byte(`{"status":"ok"}`))
				})
				http.ListenAndServe(":26657", nil)
			}()
			select {}
			return nil
		},
	}
	rootCmd.AddCommand(startCmd)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}