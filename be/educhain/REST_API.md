# EduChain Backend

## REST API

The EduChain project now includes a comprehensive REST API for interacting with the blockchain network. This API provides endpoints for querying node information, chain parameters, validators, transactions, DIDs (Decentralized Identifiers), and verifiable credentials.

### Running the REST API Server

```bash
cd be/educhain/chain
go run main.go
```

The server will start listening on port 1318. You can access the API at `http://localhost:1318/api/v1/`.

### Available Endpoints

- `/api/v1/nodeinfo` - Get node information and contract addresses
- `/api/v1/params` - Get chain parameters
- `/api/v1/validators` - Get validator information
- `/api/v1/tx/{hash}` - Get transaction details by hash
- `/api/v1/dids` - List all DIDs (can be filtered by type)
- `/api/v1/dids/{id}` - Get DID document by ID
- `/api/v1/credentials?did={did}` - Get credentials for a specific DID
- `/api/v1/credentials/verify` - Verify a credential (POST)
- `/api/v1/credentials/revoke` - Revoke a credential (POST)
- `/health` - Health check endpoint

For detailed documentation of the REST API, see [REST API Documentation](./chain/rest/README.md).

### Integration with Frontend

The REST API is designed to be easily integrated with the frontend application. The API follows RESTful principles and returns data in JSON format.

Example of fetching node information:

```javascript
async function fetchNodeInfo() {
  const response = await fetch('http://localhost:1318/api/v1/nodeinfo');
  const data = await response.json();
  console.log(data);
}
```

Example of verifying a credential:

```javascript
async function verifyCredential(credentialId) {
  const response = await fetch('http://localhost:1318/api/v1/credentials/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      credential_id: credentialId
    })
  });
  const data = await response.json();
  return data.valid;
}
```

### API Features

- **CORS Support**: API endpoints can be accessed from any origin
- **JSON Logging**: Structured logging in JSON format for better observability
- **Health Checks**: Dedicated health check endpoint for monitoring
- **Error Handling**: Consistent error responses with appropriate HTTP status codes
- **API Versioning**: All endpoints are under `/api/v1/` for future versioning

### Future Improvements

- Authentication and authorization for protected endpoints
- Pagination for list endpoints
- WebSocket support for real-time updates
- OpenAPI specification
- Rate limiting
- Additional endpoints for educational workflow automation
