# ViEduChain-Hino Data Generator

This script helps to generate comprehensive test data for the ViEduChain-Hino blockchain system.

## Features

- Generates data for all modules: EduID, EduCert, EduPay, EduMarket, EduAdmission, and ResearchLedger
- Saves generated data to a local JSON file for reference
- Supports dry-run mode to preview operations without making API calls
- Configurable number of records to generate
- Module-specific data generation

## Prerequisites

- Python 3.6+
- `requests` library

## Installation

```bash
pip install requests
```

## Usage

### Generate data for all modules

```bash
python data_generator.py
```

### Generate specific number of records

```bash
python data_generator.py --count 20
```

### Generate data for a specific module

```bash
python data_generator.py --module eduid
```

### Preview operations without making API calls

```bash
python data_generator.py --dry-run
```

### Specify a different API endpoint

```bash
python data_generator.py --api-base http://api.example.com
```

## Available Modules

- `nodeinfo`: Node information
- `eduid`: Decentralized identifiers
- `educert`: Certificates, course completions, and degrees
- `edupay`: Wallets and transactions
- `edumarket`: NFT marketplace
- `eduadmission`: Admission data (seats, scores)
- `researchledger`: Research publications

## Output

The script generates a `data.json` file containing all the generated records, which can be used for reference or testing.
It also produces a `data_generator.log` file with detailed information about the data generation process.

## Troubleshooting

If you encounter any issues:

1. Check that the API server is running and accessible
2. Verify the API base URL is correct
3. Review the log file for specific error messages
4. Make sure the contract addresses are properly deployed (you can use `fix_contract_addresses.py` if needed)
