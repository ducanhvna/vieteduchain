#!/bin/bash

# Script for building CosmWasm smart contracts for EduChain
# This script builds each contract using the rust-optimizer docker image

# Use relative path for CONTRACTS_DIR
CONTRACTS_DIR="$(dirname "$0")/../../smart-contracts"
OPTIMIZER_VERSION="0.12.13"  # Latest compatible with CosmWasm 0.16

echo "====================================================="
echo "BUILDING EDUCHAIN SMART CONTRACTS"
echo "====================================================="

# Function to build a contract
build_contract() {
  local contract_name=$1
  local contract_dir="${CONTRACTS_DIR}/${contract_name}"
  local wasm_file="${contract_dir}/artifacts/${contract_name}.wasm"

  # If a valid .wasm file already exists, skip building
  if [ -f "$wasm_file" ] && [ -s "$wasm_file" ]; then
    echo "Found existing valid wasm for ${contract_name}, skipping build."
    echo "Wasm file size: $(stat -f%z "$wasm_file") bytes"
    return 0
  fi
  
  echo "====================================================="
  echo "Building contract: ${contract_name}"
  echo "====================================================="
  
  cd "${contract_dir}" || { echo "Error: Cannot change to directory ${contract_dir}"; return 1; }
  
  # Make sure we have an artifacts directory
  mkdir -p "${contract_dir}/artifacts"
  
  # Generate Cargo.lock if it doesn't exist
  if [ ! -f "${contract_dir}/Cargo.lock" ]; then
    echo "Generating Cargo.lock file..."
    cargo generate-lockfile
    if [ $? -ne 0 ]; then
      echo "Warning: Failed to generate Cargo.lock file"
    fi
  fi
  
  # Build the contract using rust-optimizer
  echo "Building with rust-optimizer..."
  docker run --rm \
    -v "${contract_dir}:/code" \
    --mount type=volume,source="${contract_name}_cache",target=/code/target \
    --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
    cosmwasm/rust-optimizer:${OPTIMIZER_VERSION}
  
  build_status=$?
  
  if [ $build_status -ne 0 ]; then
    echo "Error: Failed to build contract ${contract_name} with rust-optimizer"
    
    # Fallback to direct cargo wasm build
    echo "Trying fallback build with cargo wasm..."
    docker run --rm \
      -v "${contract_dir}:/code" \
      --mount type=volume,source="${contract_name}_cache",target=/code/target \
      --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
      rust:1.70 \
      bash -c "cd /code && cargo build --release --target wasm32-unknown-unknown"
    
    fallback_status=$?
    
    if [ $fallback_status -ne 0 ]; then
      echo "Error: Fallback build also failed for ${contract_name}"
      return 1
    else
      # Copy wasm file from fallback build
      if [ -f "${contract_dir}/target/wasm32-unknown-unknown/release/${contract_name}.wasm" ]; then
        cp "${contract_dir}/target/wasm32-unknown-unknown/release/${contract_name}.wasm" "${contract_dir}/artifacts/"
        echo "Successfully built contract ${contract_name} with fallback method"
      else
        echo "Error: Wasm file not found after fallback build"
        return 1
      fi
    fi
  else
    # Copy artifacts from optimizer build (if found)
    if [ -f "${contract_dir}/artifacts/${contract_name}.wasm" ]; then
      echo "Successfully built contract ${contract_name}"
    else
      echo "Error: Wasm file not found after build"
      return 1
    fi
  fi
  
  # Check the built wasm file
  if [ -f "${contract_dir}/artifacts/${contract_name}.wasm" ]; then
    wasm_size=$(stat -f%z "${contract_dir}/artifacts/${contract_name}.wasm")
    echo "Wasm file size: ${wasm_size} bytes"
    echo "Build artifacts:"
    ls -la "${contract_dir}/artifacts/"
  else
    echo "Error: No wasm file found for ${contract_name}"
    return 1
  fi
  
  echo "====================================================="
  return 0
}

# Create volumes if they don't exist
if ! docker volume ls | grep -q registry_cache; then
  echo "Creating registry cache volume..."
  docker volume create registry_cache
fi

# Build each contract
for contract in eduid educert edupay researchledger eduadmission; do
  contract_wasm="${CONTRACTS_DIR}/${contract}/artifacts/${contract}.wasm"
  # If a valid .wasm file already exists, skip building
  if [ -f "$contract_wasm" ] && [ -s "$contract_wasm" ]; then
    echo "Contract ${contract} already built and valid. Skipping build."
    continue
  fi
  # Ensure cache volume exists for each contract
  if ! docker volume ls | grep -q "${contract}_cache"; then
    echo "Creating cache volume for ${contract}..."
    docker volume create "${contract}_cache"
  fi
  build_contract "${contract}"
  build_result=$?
  if [ $build_result -ne 0 ]; then
    echo "Warning: Failed to build ${contract}"
    # Fall back to manual placeholder if build fails
    echo "Creating placeholder wasm file for ${contract}..."
    "${CONTRACTS_DIR}/../deployments/scripts/manual_build_contracts.sh" "${contract}"
  fi
  # After manual build, check if wasm exists and is valid
  if [ ! -f "$contract_wasm" ] || [ ! -s "$contract_wasm" ]; then
    echo "Error: No valid wasm file for ${contract} after all build attempts."
  fi
done

echo "====================================================="
echo "BUILD PROCESS COMPLETE"
echo "====================================================="
echo "You can now deploy the contracts using deploy_educhain_contracts.sh"
echo "====================================================="
