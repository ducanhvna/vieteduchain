#!/bin/bash
# Simple script to run a standalone HTTP server for the nodeinfo endpoint

# Create directory for static content
mkdir -p /tmp/nodeinfo
cd /tmp/nodeinfo

# Create a simple nodeinfo.json file
cat > nodeinfo.json <<EOT
{
  "contracts": {
    "eduid": "wasm1abc123...",
    "educert": "wasm1def456...",
    "edupay": "wasm1ghi789...",
    "eduadmission": "wasm1jkl012...",
    "researchledger": "wasm1mno345..."
  },
  "permissioned_nodes": ["wasm1pqr678...", "wasm1stu901..."],
  "student_dids": ["did:eduid:123...", "did:eduid:456..."]
}
EOT

# Start a Python HTTP server on port 1318
docker run -d --name nodeinfo-server \
  -p 1318:8000 \
  -v /tmp/nodeinfo:/app \
  -w /app \
  python:3 python3 -m http.server 8000

echo "NodeInfo REST API server is running at http://localhost:1318/nodeinfo.json"
