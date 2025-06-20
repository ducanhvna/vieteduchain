# EduChain REST API Documentation

This document describes the REST API endpoints available for interacting with the EduChain permissioned blockchain network.

## Base URL

All API endpoints are available at the base URL: `http://localhost:1318/api/v1/`

## Endpoints

### Node Information

#### GET `/api/v1/nodeinfo`

Returns basic information about the node, including contract addresses, permissioned nodes, and registered DIDs.

**Response:**
```json
{
  "contracts": {
    "eduid": "<eduid_contract_address>",
    "educert": "<educert_contract_address>",
    "edupay": "<edupay_contract_address>",
    "eduadmission": "<eduadmission_contract_address>",
    "researchledger": "<researchledger_contract_address>"
  },
  "permissioned_nodes": ["cosmos1...", "cosmos1..."],
  "student_dids": ["did:eduid:...", "did:eduid:..."]
}
```

### Chain Parameters

#### GET `/api/v1/params`

Returns information about the blockchain parameters, including chain ID, block height, governance parameters, and education-specific parameters.

**Response:**
```json
{
  "chain_id": "educhain",
  "block_height": 5432100,
  "block_time_seconds": 5,
  "max_validators": 100,
  "bond_denom": "uedu",
  "inflation_rate": "0.07",
  "community_tax": "0.02",
  "permissioned_params": {
    "allow_new_validators": false,
    "required_endorsements": 3,
    "allow_public_participation": true
  },
  "educational_params": {
    "certification_authorities": [
      "cosmos1authority1...",
      "cosmos1authority2..."
    ],
    "trusted_institutions": [
      "cosmos1uni1...",
      "cosmos1uni2...",
      "cosmos1research1..."
    ],
    "min_endorsers_for_degree": 2
  }
}
```

### Validators

#### GET `/api/v1/validators`

Returns information about the validators (permissioned nodes) in the network.

**Response:**
```json
{
  "validators": [
    {
      "address": "cosmosvaloper1...",
      "moniker": "University Node 1",
      "voting_power": 100,
      "status": "BOND_STATUS_BONDED",
      "is_active": true
    },
    {
      "address": "cosmosvaloper2...",
      "moniker": "Research Institute Node",
      "voting_power": 95,
      "status": "BOND_STATUS_BONDED",
      "is_active": true
    }
  ],
  "total": 2
}
```

### Transactions

#### GET `/api/v1/tx/{hash}`

Returns information about a specific transaction by hash.

**Response:**
```json
{
  "tx_hash": "ABCDEF1234567890...",
  "height": 123456,
  "timestamp": "2025-06-20T10:30:45Z",
  "status": "success",
  "gas_used": 50000,
  "gas_wanted": 100000,
  "events": [
    {
      "type": "transfer",
      "attributes": {
        "recipient": "cosmos1...",
        "sender": "cosmos2...",
        "amount": "100token"
      }
    }
  ],
  "messages": [
    {
      "type": "cosmos-sdk/MsgSend",
      "data": {
        "from_address": "cosmos1...",
        "to_address": "cosmos2...",
        "amount": [{"denom": "token", "amount": "100"}]
      }
    }
  ]
}
```

### Decentralized Identifiers (DIDs)

#### GET `/api/v1/dids`

Returns a list of DIDs registered in the network. Can be filtered by type.

**Query Parameters:**
- `type`: Filter DIDs by type (student, institution, certifier)

**Response:**
```json
{
  "dids": [
    {
      "id": "did:eduid:student1",
      "controller": "cosmos1student1...",
      "type": "student",
      "created_at": "2025-01-15T08:30:00Z",
      "updated_at": "2025-01-15T08:30:00Z",
      "verification_methods": ["did:eduid:student1#keys-1"],
      "services": [
        {
          "id": "did:eduid:student1#profile",
          "type": "ProfileService",
          "service_endpoint": "https://educhain.example/api/profiles/student1"
        }
      ]
    }
  ],
  "total": 1
}
```

#### GET `/api/v1/dids/{id}`

Returns information about a specific DID by ID.

**Response:**
```json
{
  "id": "did:eduid:student1",
  "controller": "cosmos1student1...",
  "type": "student",
  "created_at": "2025-01-15T08:30:00Z",
  "updated_at": "2025-01-15T08:30:00Z",
  "verification_methods": ["did:eduid:student1#keys-1"],
  "services": [
    {
      "id": "did:eduid:student1#profile",
      "type": "ProfileService",
      "service_endpoint": "https://educhain.example/api/profiles/student1"
    }
  ]
}
```

### Verifiable Credentials

#### GET `/api/v1/credentials`

Returns a list of credentials for a specific DID.

**Query Parameters:**

- `did`: The DID to get credentials for (required)

**Response:**
```json
[
  {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "id": "http://educhain.example/credentials/3732",
    "type": ["VerifiableCredential", "UniversityDegreeCredential"],
    "issuer": "did:eduid:institution1",
    "issuanceDate": "2024-06-01T19:23:24Z",
    "credentialSubject": {
      "id": "did:eduid:student1",
      "degree": {
        "type": "BachelorDegree",
        "name": "Bachelor of Science and Engineering",
        "university": "Example University"
      },
      "gpa": "3.8"
    },
    "status": "active",
    "proof": {
      "type": "Ed25519Signature2020",
      "created": "2025-06-20T10:30:45Z",
      "verificationMethod": "did:eduid:institution1#keys-1",
      "proofPurpose": "assertionMethod",
      "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn5DzZEFQRJWVh6E34zs2U7wZg4A4RiprUBAzpzxhgzSsUrtJAeS9vivvcPL"
    }
  }
]
```

#### POST `/api/v1/credentials/verify`

Verifies a credential.

**Request Body:**
```json
{
  "credential_id": "http://educhain.example/credentials/3732"
}
```

**Response:**
```json
{
  "valid": true,
  "status": "active",
  "verified_at": "2025-06-20T10:35:22Z",
  "issued_by": "did:eduid:institution1",
  "subject_did": "did:eduid:student1",
  "credential_id": "http://educhain.example/credentials/3732"
}
```

#### POST `/api/v1/credentials/revoke`

Revokes a credential.

**Request Body:**
```json
{
  "credential_id": "http://educhain.example/credentials/3732",
  "reason": "Incorrect information"
}
```

**Response:**
```json
{
  "success": true,
  "credential_id": "http://educhain.example/credentials/3732",
  "status": "revoked",
  "revoked_at": "2025-06-20T10:40:15Z",
  "reason": "Incorrect information"
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a JSON body with an error message:

```json
{
  "error": "Error message"
}
```
