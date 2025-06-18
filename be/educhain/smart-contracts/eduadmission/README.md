# EduAdmission Smart Contract

The EduAdmission smart contract is part of the EduChain project, designed to facilitate transparent admission processes in educational institutions. This contract manages the issuance and burning of seat NFTs, handles score submissions, and ensures that the admission process is auditable and tamper-proof.

## Features

- **Seat-NFT Management**: Each admission seat is represented as a non-fungible token (NFT). Educational institutions can mint these NFTs before the admission season, and they are burned once a candidate confirms their enrollment.
  
- **Score Submission**: The contract allows for the submission of candidate scores through a secure oracle mechanism, ensuring that the data is accurate and up-to-date.

- **Matching Engine**: Implements a smart contract-based algorithm for matching candidates to available seats, ensuring that the results are immutable and verifiable.

## Components

- **Seat-NFT**: Represents each admission seat as an NFT.
- **Score Oracle**: Fetches and verifies candidate scores from the Ministry of Education.
- **Matching Engine**: Executes the admission algorithm and produces a final list of admitted candidates.

## Usage

1. **Minting Seat NFTs**: Educational institutions can mint NFTs representing available seats before the admission process begins.
2. **Submitting Scores**: Candidates' scores can be submitted through the designated oracle.
3. **Running the Matching Process**: Once all scores are submitted, the matching engine can be executed to finalize admissions.

## Development

This smart contract is built using CosmWasm and follows best practices for security and efficiency. It is designed to be modular and can be upgraded as needed.

## Testing

Comprehensive tests are included to ensure the functionality and security of the contract. Developers are encouraged to run the tests before deploying to the mainnet.

## License

This project is licensed under the Apache-2.0 License.