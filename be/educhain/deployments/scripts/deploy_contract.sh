#!/bin/bash

# Set the environment variables
CHAIN_ID="educhain-devnet"
NODE="http://localhost:26657"
CONTRACTS_DIR="../smart-contracts"

# Deploy EduID contract
echo "Deploying EduID contract..."
cd $CONTRACTS_DIR/eduid
cargo wasm build --release
wasm_file=$(ls target/wasm32-unknown-unknown/release/*.wasm)
echo "Deploying EduID contract at $wasm_file"
# Assuming the command to upload the contract is `wasmd tx wasm store`
wasmd tx wasm store $wasm_file --from <your_wallet_address> --chain-id $CHAIN_ID --gas auto --fees 5000stake -y

# Deploy EduCert contract
echo "Deploying EduCert contract..."
cd $CONTRACTS_DIR/educert
cargo wasm build --release
wasm_file=$(ls target/wasm32-unknown-unknown/release/*.wasm)
echo "Deploying EduCert contract at $wasm_file"
wasmd tx wasm store $wasm_file --from <your_wallet_address> --chain-id $CHAIN_ID --gas auto --fees 5000stake -y

# Deploy EduPay contract
echo "Deploying EduPay contract..."
cd $CONTRACTS_DIR/edupay
cargo wasm build --release
wasm_file=$(ls target/wasm32-unknown-unknown/release/*.wasm)
echo "Deploying EduPay contract at $wasm_file"
wasmd tx wasm store $wasm_file --from <your_wallet_address> --chain-id $CHAIN_ID --gas auto --fees 5000stake -y

# Deploy ResearchLedger contract
echo "Deploying ResearchLedger contract..."
cd $CONTRACTS_DIR/researchledger
cargo wasm build --release
wasm_file=$(ls target/wasm32-unknown-unknown/release/*.wasm)
echo "Deploying ResearchLedger contract at $wasm_file"
wasmd tx wasm store $wasm_file --from <your_wallet_address> --chain-id $CHAIN_ID --gas auto --fees 5000stake -y

# Deploy EduAdmission contract
echo "Deploying EduAdmission contract..."
cd $CONTRACTS_DIR/eduadmission
cargo wasm build --release
wasm_file=$(ls target/wasm32-unknown-unknown/release/*.wasm)
echo "Deploying EduAdmission contract at $wasm_file"
wasmd tx wasm store $wasm_file --from <your_wallet_address> --chain-id $CHAIN_ID --gas auto --fees 5000stake -y

echo "All contracts deployed successfully!"