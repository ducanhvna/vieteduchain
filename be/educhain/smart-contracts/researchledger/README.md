# ResearchLedger Smart Contract

The ResearchLedger module is designed to provide functionalities for managing research data, ensuring data integrity, and preventing plagiarism. This module leverages blockchain technology to create a transparent and secure environment for researchers.

## Features

- **Data Fingerprinting**: Allows researchers to register their data by creating a unique hash (SHA-256) of their documents, ensuring authenticity and integrity.
- **DOI-NFT**: Each published research work is associated with a Non-Fungible Token (NFT) that contains a Digital Object Identifier (DOI), providing a permanent link to the work.
- **Plagiarism Bounty**: A mechanism that rewards users for reporting plagiarism by submitting evidence in the form of hash comparisons.

## Directory Structure

- `src/`: Contains the Rust source files for the smart contract logic.
- `schema/`: Holds the schema definitions for the contract's data structures.
- `tests/`: Includes unit tests to ensure the contract functions as expected.
- `migrations/`: Contains scripts for migrating the contract to new versions.
- `Cargo.toml`: The configuration file for managing dependencies and project settings.

## Usage

To deploy the ResearchLedger smart contract, follow the instructions in the `deployments/scripts/deploy_contract.sh` script. Ensure that your blockchain environment is set up correctly and that you have the necessary permissions to deploy contracts.

## License

This project is licensed under the Apache-2.0 License. Please see the LICENSE file for more information.