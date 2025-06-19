# EduID Smart Contract

The EduID smart contract is a key component of the EduChain project, designed to facilitate self-sovereign identity (SSI) management for students and researchers. This contract allows users to create, manage, and verify their digital identities securely on the blockchain.

## Features

- **Decentralized Identity Management**: Users can create and manage their own Decentralized Identifiers (DIDs) without relying on a central authority.
- **Selective Disclosure**: Supports selective disclosure of identity attributes using Zero-Knowledge Proofs (ZKPs), ensuring privacy and security.
- **Interoperability**: Designed to be compatible with other modules in the EduChain ecosystem and other blockchains via IBC (Inter-Blockchain Communication).

## Directory Structure

- `src/`: Contains the Rust source code for the EduID smart contract.
- `schema/`: Holds the schema definitions for the contract's data structures.
- `tests/`: Includes unit and integration tests for the smart contract functionality.
- `migrations/`: Contains migration scripts for upgrading the contract.
- `Cargo.toml`: The configuration file for the Rust package manager, specifying dependencies and project metadata.

## Getting Started

To get started with the EduID smart contract, follow these steps:

1. **Clone the Repository**: Clone the EduChain repository to your local machine.
2. **Build the Contract**: Navigate to the `eduid` directory and run `cargo build` to compile the smart contract.
3. **Deploy the Contract**: Use the provided deployment scripts to deploy the contract to the desired blockchain network.

## Testing

To run the tests for the EduID smart contract, navigate to the `tests` directory and execute the test suite using `cargo test`.

## License

This project is licensed under the Apache-2.0 License. See the LICENSE file for more details.