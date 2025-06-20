module github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain

go 1.20

require (
	github.com/cosmos/cosmos-sdk v0.50.0
	github.com/spf13/viper v1.14.0
)

replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain/rest => ./rest
