# EduCert Smart Contract

The EduCert smart contract is a module designed to manage the issuance and revocation of Verifiable Credentials (VC) within the EduChain ecosystem. This contract facilitates the creation, verification, and management of educational credentials in a secure and decentralized manner.

## Features

- **Issuance of Verifiable Credentials**: Allows educational institutions to issue digital credentials that can be verified by third parties.
- **Revocation Registry**: Maintains a list of revoked credentials to ensure that only valid credentials are recognized.
- **Viewer Portal**: Provides a web application for users to view and verify their credentials.

## Structure

The EduCert module is structured as follows:

- `src/`: Contains the main Rust source files for the smart contract.
- `schema/`: Holds the schema definitions for the contract.
- `tests/`: Includes test files to ensure the contract functions as expected.
- `migrations/`: Contains migration scripts for upgrading the contract.
- `Cargo.toml`: Configuration file for managing dependencies and building the contract.

## Usage

To issue a credential, the educational institution can call the `issue` function with the necessary details. The credential will be signed and stored on the blockchain, while a hash of the credential will be recorded for verification purposes.

## Development

To build and test the EduCert smart contract, use the following commands:

```bash
cargo build
cargo test
```

Ensure that you have the Rust toolchain installed and configured properly.

## License

This project is licensed under the Apache-2.0 License. Please see the LICENSE file for more details.