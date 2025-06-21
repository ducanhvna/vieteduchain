#!/bin/bash
# Manual script to initialize the blockchain with a validator

set -e

# Clean any existing data
rm -rf /root/.wasmd/*
mkdir -p /root/.wasmd

# Initialize the chain
wasmd init --chain-id=educhain "educhain-node"

# Create a key for the validator
wasmd keys add validator --keyring-backend=test

# Add this account as a genesis account with a very large amount of tokens
VALIDATOR_ADDR=$(wasmd keys show validator -a --keyring-backend=test)
wasmd add-genesis-account $VALIDATOR_ADDR 1000000000000000stake,1000000000ucosm

# Generate the genesis transaction with a large stake amount
wasmd gentx validator 100000000000000stake --chain-id=educhain --keyring-backend=test

# Collect the genesis transaction
wasmd collect-gentxs

# Verify that the validator set is properly configured in the genesis file
echo "Checking validator configuration in genesis.json..."
VALIDATORS=$(jq -r '.app_state.staking.validators | length' /root/.wasmd/config/genesis.json)
TOTAL_POWER=$(jq -r '.app_state.staking.last_total_power' /root/.wasmd/config/genesis.json)

echo "Validators: $VALIDATORS"
echo "Total Power: $TOTAL_POWER"

if [ "$VALIDATORS" = "0" ] || [ -z "$VALIDATORS" ] || [ "$TOTAL_POWER" = "0" ]; then
  echo "Warning: No validators found in genesis file. Creating manually..."
  
  # Create a backup
  cp /root/.wasmd/config/genesis.json /root/.wasmd/config/genesis.json.bak
  
  # Get validator data from the gentx
  PUBKEY=$(jq -r '.app_state.genutil.gen_txs[0].body.messages[0].pubkey."@type"' /root/.wasmd/config/genesis.json)
  PUBKEY_VALUE=$(jq -r '.app_state.genutil.gen_txs[0].body.messages[0].pubkey.key' /root/.wasmd/config/genesis.json)
  VALIDATOR_ADDR=$(wasmd keys show validator --bech val -a --keyring-backend=test)
  
  echo "Validator address: $VALIDATOR_ADDR"
  echo "Validator pubkey type: $PUBKEY"
  echo "Validator pubkey value: $PUBKEY_VALUE"
  
  # Update staking section with validator info
  jq '.app_state.staking.validators = [{"operator_address":"'$VALIDATOR_ADDR'","consensus_pubkey":{"@type":"'$PUBKEY'","key":"'$PUBKEY_VALUE'"},"jailed":false,"status":"BOND_STATUS_BONDED","tokens":"100000000000000","delegator_shares":"100000000000000.000000000000000000","description":{"moniker":"validator","identity":"","website":"","security_contact":"","details":""},"unbonding_height":"0","unbonding_time":"1970-01-01T00:00:00Z","commission":{"commission_rates":{"rate":"0.100000000000000000","max_rate":"0.200000000000000000","max_change_rate":"0.010000000000000000"},"update_time":"2025-06-21T00:00:00Z"},"min_self_delegation":"1"}]' /root/.wasmd/config/genesis.json > /root/.wasmd/config/genesis.json.tmp
  mv /root/.wasmd/config/genesis.json.tmp /root/.wasmd/config/genesis.json
  
  # Update last validator powers and total power
  jq '.app_state.staking.last_validator_powers = [{"address":"'$VALIDATOR_ADDR'","power":"100000000000000"}]' /root/.wasmd/config/genesis.json > /root/.wasmd/config/genesis.json.tmp
  mv /root/.wasmd/config/genesis.json.tmp /root/.wasmd/config/genesis.json
  
  jq '.app_state.staking.last_total_power = "100000000000000"' /root/.wasmd/config/genesis.json > /root/.wasmd/config/genesis.json.tmp
  mv /root/.wasmd/config/genesis.json.tmp /root/.wasmd/config/genesis.json
  
  # Add delegation
  DELEGATOR_ADDR=$(wasmd keys show validator -a --keyring-backend=test)
  jq '.app_state.staking.delegations = [{"delegator_address":"'$DELEGATOR_ADDR'","validator_address":"'$VALIDATOR_ADDR'","shares":"100000000000000.000000000000000000"}]' /root/.wasmd/config/genesis.json > /root/.wasmd/config/genesis.json.tmp
  mv /root/.wasmd/config/genesis.json.tmp /root/.wasmd/config/genesis.json
fi

echo "Genesis initialization complete!"
