#!/bin/bash

# This script migrates the smart contracts to the latest version.

set -e

# Define the smart contract directories
CONTRACTS=("eduid" "educert" "edupay" "researchledger" "eduadmission")

# Loop through each contract and perform migration
for CONTRACT in "${CONTRACTS[@]}"; do
    echo "Migrating contract: $CONTRACT"
    
    # Navigate to the contract directory
    cd ../smart-contracts/$CONTRACT/migrations
    
    # Run the migration command (assuming a migration command exists)
    # Replace 'migration_command' with the actual command used for migration
    migration_command
    
    echo "Migration for contract $CONTRACT completed."
    
    # Navigate back to the scripts directory
    cd ../../..
done

echo "All contracts migrated successfully."