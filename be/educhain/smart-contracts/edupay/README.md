# EduPay Smart Contract

The EduPay module is designed to facilitate tuition payments and scholarship disbursements within the EduChain ecosystem. This module leverages stablecoin technology to ensure secure and efficient transactions between students and educational institutions.

## Features

- **Stablecoin Integration**: Utilizes a fiat-collateralized stablecoin (eVND) for transactions, ensuring stability and reliability in payments.
- **Escrow Contract**: Implements an escrow mechanism to hold funds until proof of enrollment is verified, ensuring trust between parties.
- **Oracle Integration**: Connects to price oracles to maintain accurate exchange rates between VNĐ and USDC, ensuring fair transactions.
- **Transaction Efficiency**: Aims for transaction finality within 5 seconds and minimal transaction fees (less than 0.1%).

## Directory Structure

- `src/`: Contains the Rust source code for the EduPay smart contract.
- `schema/`: Holds the schema definitions for the EduPay smart contract.
- `tests/`: Includes test cases to ensure the functionality and security of the EduPay module.
- `migrations/`: Contains migration scripts for upgrading the EduPay smart contract.
- `Cargo.toml`: Configuration file for managing dependencies and project settings.

## Getting Started

To get started with the EduPay module, ensure you have the necessary development environment set up for Rust and CosmWasm. Follow the instructions in the `docs/tutorials` directory for detailed setup and deployment guides.

## License

This project is licensed under the Apache-2.0 License. Please see the LICENSE file for more information.