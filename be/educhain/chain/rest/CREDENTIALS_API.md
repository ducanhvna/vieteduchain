# Verifiable Credentials API Documentation

This document describes the credential-related REST API endpoints for the EduChain permissioned blockchain.

## Base URL

All API endpoints are available at the base URL: `http://localhost:1318/api/v1/`

## Credentials Endpoints

### GET `/api/v1/credentials`

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

### POST `/api/v1/credentials/verify`

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

### POST `/api/v1/credentials/revoke`

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
