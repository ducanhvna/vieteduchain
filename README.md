# Cosmos Permissioned Network

## Overview
The Cosmos Permissioned Network is a decentralized application built using the Cosmos SDK and CosmWasm. This project implements a permissioned blockchain ecosystem for educational credential management, payments, identity verification, research ledger, and admission processes. The system uses smart contracts written in Rust and compiled to WebAssembly (WASM) that can be deployed on a Cosmos-based blockchain.

## Project Structure
```
cosmos-permissioned-network
├── be                  # Backend components
│   └── educhain        # Educational blockchain components
│       ├── chain       # Cosmos SDK application and modules
│       ├── clients     # Client SDKs (Flutter, GraphQL, TypeScript)
│       ├── deployments # Deployment configurations and scripts
│       │   ├── devnet  # Local development network configuration
│       │   └── scripts # Deployment and interaction scripts
│       ├── docs        # Documentation and specifications
│       ├── explorer    # Blockchain explorer web application
│       ├── ibc-relay   # Inter-blockchain communication relay
│       ├── monitoring  # Grafana and Prometheus monitoring
│       └── smart-contracts # CosmWasm smart contracts
│           ├── educert       # Educational credential contract
│           ├── edupay        # Payment processing contract
│           ├── eduid         # Identity verification contract
│           ├── researchledger # Research documentation contract
│           └── eduadmission  # Admission process contract
```

## Smart Contracts

The project includes the following smart contracts:

1. **EduCert**: Educational credential management contract that handles the issuance, verification, and revocation of educational certificates.

2. **EduPay**: Payment processing contract that enables secure escrow-based payments between educational institutions and students.

3. **EduID**: Identity verification contract that implements a decentralized identity (DID) system for educational contexts.

4. **ResearchLedger**: Contract for documenting and verifying research contributions and publications.

5. **EduAdmission**: Contract that manages the admission process between educational institutions and applicants.

## Getting Started

### Prerequisites

- Rust (version 1.70.0 or higher)
- Go (version 1.20 or higher)
- Docker and Docker Compose
- wasm32-unknown-unknown target for Rust (`rustup target add wasm32-unknown-unknown`)

### Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cosmos-permissioned-network.git
cd cosmos-permissioned-network
```

2. Start the local blockchain node:

```bash
cd be/educhain/deployments/devnet
./run_wasmd_node.sh
```

3. Build the smart contracts:

```bash
cd be/educhain/deployments/scripts
./build_educhain_contracts.sh
```

4. Deploy the smart contracts to the local blockchain:

```bash
cd be/educhain/deployments/scripts
./deploy_educhain_contracts.sh
```

### Server Deployment

When deploying to a server environment, follow these steps in the exact order:

1. Clone the code repository:

```bash
git clone https://github.com/yourusername/cosmos-permissioned-network.git
cd cosmos-permissioned-network
```

2. Initialize and run the blockchain node:

```bash
cd be/educhain/deployments/devnet
./run_wasmd_node.sh
```

3. Build all the smart contracts:

```bash
cd be/educhain/deployments/scripts
./build_educhain_contracts.sh
```

4. Deploy the smart contracts to the blockchain:

```bash
cd be/educhain/deployments/scripts
./deploy_educhain_contracts.sh
```

5. Update contract addresses in your application configuration:

```bash
# Contract addresses will be stored in these files after deployment
cat be/educhain/deployments/devnet/data/educert_address.txt
cat be/educhain/deployments/devnet/data/edupay_address.txt
cat be/educhain/deployments/devnet/data/eduid_address.txt
cat be/educhain/deployments/devnet/data/researchledger_address.txt
cat be/educhain/deployments/devnet/data/eduadmission_address.txt
```

**Important**: The server environment will not automatically synchronize with your local environment. Blockchain data, account states, and contract interactions from your local development environment will not be present on the server. Each deployment creates a new blockchain instance with fresh state.

### Interacting with Contracts

After deployment, you can interact with the contracts using the provided scripts:

```bash
cd be/educhain/deployments/scripts
./interact_with_contracts.sh <contract_name> <function_name> <parameters>
```

## Contract Size Information

Current compiled contract sizes:

- **educert**: 226,859 bytes
- **edupay**: 149,759 bytes
- **eduid**: 155,441 bytes
- **researchledger**: 158,669 bytes
- **eduadmission**: 165,948 bytes

## Troubleshooting

If you encounter build issues with the smart contracts, you can try the manual build approach:

```bash
cd be/educhain/deployments/scripts
./manual_build_contracts.sh
```

## Contribution

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.