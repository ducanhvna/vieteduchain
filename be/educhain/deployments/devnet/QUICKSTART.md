# EduChain Blockchain Core - Quick Start Guide

## Overview
This directory contains the core blockchain infrastructure for EduChain, built on CosmWasm. The solution has been simplified for easy setup and operation.

## Prerequisites
- Docker installed and running
- Ports 26657, 1317, and 9090 available

## Quick Start

### 1. Start the Blockchain
```bash
cd be/educhain/deployments/devnet
./start_educhain.sh
```

### 2. Verify It's Running
```bash
# Check node status
curl http://localhost:26657/status

# Check REST API
curl http://localhost:1317/cosmos/base/tendermint/v1beta1/node_info

# View blockchain logs
docker logs -f educhain-node
```

### 3. Stop the Blockchain
```bash
docker stop educhain-node
```

## Available Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| **RPC API** | http://localhost:26657 | Main blockchain RPC interface |
| **REST API** | http://localhost:1317 | HTTP REST API for queries |
| **gRPC** | http://localhost:9090 | Advanced protocol buffer interface |

## Key Features

- ✅ **Auto-initialization**: Creates blockchain genesis if not exists
- ✅ **Persistent data**: Blockchain state saved in `./data` directory  
- ✅ **External access**: APIs accessible from outside Docker
- ✅ **CORS enabled**: Web applications can interact with APIs
- ✅ **Pre-funded validator**: Ready-to-use validator with tokens

## Technical Details

- **Chain ID**: `educhain`
- **Node Name**: `educhain-node`
- **Validator**: Pre-configured with 300B stake tokens
- **Consensus**: Tendermint with single validator
- **Base Image**: `cosmwasm/wasmd:v0.50.0`

## Troubleshooting

### Port Already in Use
```bash
# Find and stop processes using the ports
lsof -ti:26657,1317,9090 | xargs kill -9
```

### Clear Blockchain Data
```bash
# Stop node and remove all blockchain data
docker stop educhain-node
rm -rf ./data
./start_educhain.sh  # Restart with fresh blockchain
```

### View Detailed Logs
```bash
docker logs educhain-node
```

## Development

The blockchain automatically initializes with:
- A validator account with a fixed mnemonic for reproducibility
- Sufficient tokens for testing (10T stake tokens)
- Genesis configuration optimized for development

## Files

- `start_educhain.sh` - Main startup script
- `Dockerfile.complete` - Docker image definition
- `.gitignore` - Excludes blockchain data from git
- `data/` - Blockchain state directory (auto-created)

---

**Status**: ✅ The core blockchain is now working and can be started with a single command!