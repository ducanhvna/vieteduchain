#!/usr/bin/env python3
"""
FastAPI implementation of the Custom REST API for Cosmos Permissioned Network
This replaces the Go implementation with a Python-based FastAPI version
"""

from fastapi import FastAPI, HTTPException, Request, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import uvicorn
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="EduChain Custom API",
    description="Custom REST API for Cosmos Permissioned Network",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
TENDERMINT_RPC_URL = os.getenv("TENDERMINT_RPC_URL", "http://localhost:26657")
COSMOS_REST_URL = os.getenv("COSMOS_REST_URL", "http://localhost:1317")

# Mocks (for demo purposes when actual data is not available)
MOCK_DATA = {
    "nodeinfo": {
        "node_id": "b267cdc169df88998f1407487315864bad554840",
        "network": "educhain",
        "version": "0.40.2",
        "channels": "40202120212223303800",
        "moniker": "EduChain Validator Node",
        "other": {
            "tx_index": "on",
            "rpc_address": "tcp://0.0.0.0:26657"
        },
        "application_version": {
            "name": "wasmd",
            "server_name": "wasmd",
            "version": "0.40.2",
            "git_commit": "8131b3b119f6fe3e3c98c5aa8b70cd78d9d0d8b7",
            "build_tags": "netgo",
            "go_version": "go version go1.19.13 linux/amd64"
        },
        "contracts": [
            {"name": "EduID", "address": "cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr"},
            {"name": "EduCert", "address": "cosmos1ees2tqj6hh5kz3vu2XXXz8sSmt2aaagt9qzya66nu4t9qfgxynaqg6mvx8"},
            {"name": "EduPay", "address": "cosmos1nlmvj0xvmkvggt7tjxyv86jkqdrsfh79zs33v9wy9pkv5vmr6fnsdv67px"}
        ],
        "permissioned_nodes": [
            {"node_id": "b267cdc169df88998f1407487315864bad554840", "name": "validator-1", "role": "validator"},
            {"node_id": "d7a573d45823bd80c9a0586d64788c44e2d0addb", "name": "authority-1", "role": "authority"}
        ],
        "student_dids": 24,
        "issued_credentials": 132,
        "last_processed_block": 5721
    },
    "params": {
        "chain_id": "educhain",
        "blocks_per_year": 6311520,
        "inflation_rate": "0.130000000000000000",
        "inflation_max": "0.200000000000000000",
        "inflation_min": "0.070000000000000000",
        "goal_bonded": "0.670000000000000000",
        "unbonding_time": "1814400000000000",
        "max_validators": 100,
        "max_entries": 7,
        "historical_entries": 10000,
        "bond_denom": "stake",
        "base_proposer_reward": "0.010000000000000000",
        "bonus_proposer_reward": "0.040000000000000000",
        "community_tax": "0.020000000000000000"
    },
    "contracts": [
        {
            "name": "EduID",
            "address": "cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr",
            "creator": "cosmos1ktvz9rmd87cc5u80fxjenrptjqp25zlhyjz973",
            "code_id": 1,
            "type": "identity",
            "created_at": "2025-06-01T10:15:30Z",
            "last_updated": "2025-06-20T14:22:10Z",
            "version": "1.0.0",
            "features": ["did_resolution", "credential_issuance", "verification"],
            "admin": "cosmos1ktvz9rmd87cc5u80fxjenrptjqp25zlhyjz973",
            "metadata": {
                "description": "Digital Identity Management for Educational Institutions",
                "website": "https://eduid.example.com",
                "repository": "https://github.com/example/eduid"
            }
        },
        {
            "name": "EduCert",
            "address": "cosmos1ees2tqj6hh5kz3vu2XXXz8sSmt2aaagt9qzya66nu4t9qfgxynaqg6mvx8",
            "creator": "cosmos1ktvz9rmd87cc5u80fxjenrptjqp25zlhyjz973",
            "code_id": 2,
            "type": "certification",
            "created_at": "2025-06-02T11:20:45Z",
            "last_updated": "2025-06-19T16:30:22Z",
            "version": "1.1.0",
            "features": ["certificate_issuance", "verification", "revocation"],
            "admin": "cosmos1ktvz9rmd87cc5u80fxjenrptjqp25zlhyjz973",
            "metadata": {
                "description": "Academic Certificate Management System",
                "website": "https://educert.example.com",
                "repository": "https://github.com/example/educert"
            }
        },
        {
            "name": "EduPay",
            "address": "cosmos1nlmvj0xvmkvggt7tjxyv86jkqdrsfh79zs33v9wy9pkv5vmr6fnsdv67px",
            "creator": "cosmos1ktvz9rmd87cc5u80fxjenrptjqp25zlhyjz973",
            "code_id": 3,
            "type": "payment",
            "created_at": "2025-06-03T09:45:15Z",
            "last_updated": "2025-06-18T12:10:05Z",
            "version": "0.9.5",
            "features": ["fee_payment", "scholarships", "refunds"],
            "admin": "cosmos1ktvz9rmd87cc5u80fxjenrptjqp25zlhyjz973",
            "metadata": {
                "description": "Educational Payment Processing System",
                "website": "https://edupay.example.com",
                "repository": "https://github.com/example/edupay"
            }
        }
    ]
}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/api/v1/nodeinfo")
async def node_info():
    """Get node information including custom EduChain data"""
    logger.info("Request to /api/v1/nodeinfo")
    
    try:
        # Try to get real data from Tendermint RPC
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{TENDERMINT_RPC_URL}/status")
            
            if response.status_code == 200:
                tm_data = response.json()
                
                # Extract relevant data
                node_info = tm_data.get("result", {}).get("node_info", {})
                
                # Combine with our custom data
                result = {
                    "node_id": node_info.get("id", MOCK_DATA["nodeinfo"]["node_id"]),
                    "network": node_info.get("network", MOCK_DATA["nodeinfo"]["network"]),
                    "version": node_info.get("version", MOCK_DATA["nodeinfo"]["version"]),
                    "channels": node_info.get("channels", MOCK_DATA["nodeinfo"]["channels"]),
                    "moniker": node_info.get("moniker", MOCK_DATA["nodeinfo"]["moniker"]),
                    "other": node_info.get("other", MOCK_DATA["nodeinfo"]["other"]),
                    # Add custom EduChain data
                    "contracts": MOCK_DATA["nodeinfo"]["contracts"],
                    "permissioned_nodes": MOCK_DATA["nodeinfo"]["permissioned_nodes"],
                    "student_dids": MOCK_DATA["nodeinfo"]["student_dids"],
                    "issued_credentials": MOCK_DATA["nodeinfo"]["issued_credentials"],
                    "last_processed_block": MOCK_DATA["nodeinfo"]["last_processed_block"]
                }
                
                # Add application version if available
                app_version = tm_data.get("result", {}).get("application_version")
                if app_version:
                    result["application_version"] = app_version
                else:
                    result["application_version"] = MOCK_DATA["nodeinfo"]["application_version"]
                    
                return result
    except Exception as e:
        logger.warning(f"Error fetching node info from Tendermint RPC: {str(e)}")
        logger.info("Returning mock data")
        
    # Return mock data if we couldn't get real data
    return MOCK_DATA["nodeinfo"]

@app.get("/api/v1/params")
async def chain_params():
    """Get chain parameters"""
    logger.info("Request to /api/v1/params")
    
    try:
        # Try to get real data from Cosmos REST API
        # This is a simplified example, in practice you would need to query multiple endpoints
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{COSMOS_REST_URL}/cosmos/staking/v1beta1/params")
            
            if response.status_code == 200:
                # Process and return real data
                # This is simplified, in reality you'd need to aggregate params from multiple modules
                return response.json().get("params", MOCK_DATA["params"])
    except Exception as e:
        logger.warning(f"Error fetching chain params from Cosmos REST API: {str(e)}")
        logger.info("Returning mock data")
    
    # Return mock data if we couldn't get real data
    return MOCK_DATA["params"]

@app.get("/api/v1/validators")
async def validators():
    """Get list of validators"""
    logger.info("Request to /api/v1/validators")
    
    try:
        # Try to get real data from Cosmos REST API
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{COSMOS_REST_URL}/cosmos/staking/v1beta1/validators")
            
            if response.status_code == 200:
                # Process and return validators
                return response.json()
    except Exception as e:
        logger.warning(f"Error fetching validators from Cosmos REST API: {str(e)}")
        
    # Return simplified mock data if we couldn't get real data
    return {
        "validators": [
            {
                "operator_address": "wasmvaloper1ktvz9rmd87cc5u80fxjenrptjqp25zlh3whest",
                "consensus_pubkey": {
                    "@type": "/cosmos.crypto.ed25519.PubKey",
                    "key": "UA/hBuDHBAgnTJN0P5brUfsYrRyiIeBe5hM1+pX6fiA="
                },
                "jailed": False,
                "status": "BOND_STATUS_BONDED",
                "tokens": "300000000000",
                "delegator_shares": "300000000000.000000000000000000",
                "description": {
                    "moniker": "my-wasmd-node",
                    "identity": "",
                    "website": "",
                    "security_contact": "",
                    "details": ""
                },
                "unbonding_height": "0",
                "unbonding_time": "1970-01-01T00:00:00Z",
                "commission": {
                    "commission_rates": {
                        "rate": "0.100000000000000000",
                        "max_rate": "0.200000000000000000",
                        "max_change_rate": "0.010000000000000000"
                    },
                    "update_time": "2025-06-01T00:00:00Z"
                },
                "min_self_delegation": "1"
            }
        ],
        "pagination": {
            "next_key": None,
            "total": "1"
        }
    }

@app.get("/api/v1/tx/{hash}")
async def get_tx(hash: str = Path(..., description="Transaction hash")):
    """Get transaction by hash"""
    logger.info(f"Request to /api/v1/tx/{hash}")
    
    try:
        # Try to get real data from Cosmos REST API
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{COSMOS_REST_URL}/cosmos/tx/v1beta1/txs/{hash}")
            
            if response.status_code == 200:
                tx_data = response.json()
                
                # Process and return formatted transaction data
                # This is simplified, in reality you'd format the response more extensively
                return {
                    "tx_hash": hash,
                    "height": int(tx_data.get("tx_response", {}).get("height", "0")),
                    "timestamp": tx_data.get("tx_response", {}).get("timestamp", ""),
                    "status": "success" if tx_data.get("tx_response", {}).get("code", 1) == 0 else "failed",
                    "gas_used": int(tx_data.get("tx_response", {}).get("gas_used", "0")),
                    "gas_wanted": int(tx_data.get("tx_response", {}).get("gas_wanted", "0")),
                    "raw_log": tx_data.get("tx_response", {}).get("raw_log", ""),
                    # Add more fields as needed
                }
    except Exception as e:
        logger.warning(f"Error fetching tx {hash} from Cosmos REST API: {str(e)}")
    
    # Return mock data if we couldn't get real data
    return {
        "tx_hash": hash,
        "height": 5721,
        "timestamp": "2025-06-20T15:30:45Z",
        "status": "success",
        "gas_used": 65423,
        "gas_wanted": 80000,
        "events": [
            {
                "type": "transfer",
                "attributes": {
                    "recipient": "cosmos1recipient",
                    "sender": "cosmos1sender",
                    "amount": "100token"
                }
            }
        ],
        "messages": [
            {
                "type": "cosmos-sdk/MsgSend",
                "data": {
                    "from_address": "cosmos1sender",
                    "to_address": "cosmos1recipient",
                    "amount": [{"denom": "token", "amount": "100"}]
                }
            }
        ]
    }

@app.get("/api/v1/transactions")
async def get_txs(
    page: int = Query(1, description="Page number"),
    limit: int = Query(10, description="Items per page")
):
    """Get list of transactions"""
    logger.info(f"Request to /api/v1/transactions?page={page}&limit={limit}")
    
    try:
        # Try to get real data from Cosmos REST API
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{COSMOS_REST_URL}/cosmos/tx/v1beta1/txs",
                params={"pagination.limit": str(limit), "pagination.offset": str((page-1)*limit), "order_by": "ORDER_BY_DESC"}
            )
            
            if response.status_code == 200:
                # Process and return formatted transactions data
                # This is simplified, in reality you'd format the response more extensively
                return response.json()
    except Exception as e:
        logger.warning(f"Error fetching transactions from Cosmos REST API: {str(e)}")
    
    # Return mock data if we couldn't get real data
    return {
        "txs": [
            {
                "tx_hash": "ABCDEF1234567890ABCDEF1234567890ABCDEF12",
                "height": 5721,
                "timestamp": "2025-06-20T15:30:45Z",
                "status": "success",
                "gas_used": 65423,
                "gas_wanted": 80000,
                "events": [
                    {
                        "type": "transfer",
                        "attributes": {
                            "recipient": "cosmos1recipient",
                            "sender": "cosmos1sender",
                            "amount": "100token"
                        }
                    }
                ],
                "messages": [
                    {
                        "type": "cosmos-sdk/MsgSend",
                        "data": {
                            "from_address": "cosmos1sender",
                            "to_address": "cosmos1recipient",
                            "amount": [{"denom": "token", "amount": "100"}]
                        }
                    }
                ]
            }
        ],
        "total": 42,
        "page": page,
        "limit": limit
    }

@app.get("/api/v1/dids")
async def get_dids(
    page: int = Query(1, description="Page number"),
    limit: int = Query(10, description="Items per page")
):
    """Get list of DIDs"""
    logger.info(f"Request to /api/v1/dids?page={page}&limit={limit}")
    
    # For DIDs, we're using mock data as there's no direct equivalent in Cosmos SDK
    offset = (page - 1) * limit
    
    # Generate some sample DIDs
    total_dids = 24
    dids = []
    
    for i in range(offset, min(offset + limit, total_dids)):
        did_id = f"did:edu:123456{i:02d}"
        dids.append({
            "id": did_id,
            "controller": "cosmos1ktvz9rmd87cc5u80fxjenrptjqp25zlhyjz973",
            "verificationMethod": [
                {
                    "id": f"{did_id}#keys-1",
                    "type": "Ed25519VerificationKey2020",
                    "controller": did_id,
                    "publicKeyMultibase": f"z6Mk{i}rqhMkmjbzowQFgzs"
                }
            ],
            "authentication": [f"{did_id}#keys-1"],
            "created": "2025-06-01T10:15:30Z",
            "updated": "2025-06-20T14:22:10Z"
        })
    
    return {
        "dids": dids,
        "total": total_dids,
        "page": page,
        "limit": limit
    }

@app.get("/api/v1/dids/{id}")
async def get_did_by_id(id: str = Path(..., description="DID identifier")):
    """Get DID by ID"""
    logger.info(f"Request to /api/v1/dids/{id}")
    
    # For DIDs, we're using mock data as there's no direct equivalent in Cosmos SDK
    # In a real implementation, you would query the smart contract
    
    if not id.startswith("did:edu:"):
        raise HTTPException(status_code=404, detail="DID not found")
    
    # Generate a sample DID document
    return {
        "id": id,
        "controller": "cosmos1ktvz9rmd87cc5u80fxjenrptjqp25zlhyjz973",
        "verificationMethod": [
            {
                "id": f"{id}#keys-1",
                "type": "Ed25519VerificationKey2020",
                "controller": id,
                "publicKeyMultibase": "z6MkrqhMkmjbzowQFgzsLoozdALc7ZH1qWth5RZgTqscvzRV"
            }
        ],
        "authentication": [f"{id}#keys-1"],
        "service": [
            {
                "id": f"{id}#edu-service",
                "type": "EducationalService",
                "serviceEndpoint": "https://university.example/api/v1"
            }
        ],
        "created": "2025-06-01T10:15:30Z",
        "updated": "2025-06-20T14:22:10Z"
    }

@app.get("/api/v1/credentials")
async def get_credentials(
    page: int = Query(1, description="Page number"),
    limit: int = Query(10, description="Items per page")
):
    """Get list of verifiable credentials"""
    logger.info(f"Request to /api/v1/credentials?page={page}&limit={limit}")
    
    # For credentials, we're using mock data
    offset = (page - 1) * limit
    
    # Generate some sample credentials
    total_credentials = 132
    credentials = []
    
    for i in range(offset, min(offset + limit, total_credentials)):
        cred_id = f"http://educhain.example/credentials/{i:04d}"
        credentials.append({
            "id": cred_id,
            "type": ["VerifiableCredential", "DegreeCredential"],
            "issuer": "did:edu:issuer",
            "issuanceDate": "2025-06-10T12:00:00Z",
            "credentialSubject": {
                "id": f"did:edu:123456{i % 24:02d}",
                "degree": {
                    "type": "BachelorDegree",
                    "name": "Bachelor of Science in Computer Science"
                }
            },
            "status": "active"
        })
    
    return {
        "credentials": credentials,
        "total": total_credentials,
        "page": page,
        "limit": limit
    }

@app.post("/api/v1/credentials/verify")
async def verify_credential(request: Request):
    """Verify a credential"""
    logger.info("Request to /api/v1/credentials/verify")
    
    try:
        body = await request.json()
        credential_id = body.get("credential_id")
        
        if not credential_id:
            raise HTTPException(status_code=400, detail="credential_id is required")
        
        # In a real implementation, you would verify the credential
        # For this mock, we'll return a success response
        return {
            "verified": True,
            "credential_id": credential_id,
            "timestamp": datetime.now().isoformat(),
            "status": "valid"
        }
    except Exception as e:
        logger.error(f"Error verifying credential: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/credentials/revoke")
async def revoke_credential(request: Request):
    """Revoke a credential"""
    logger.info("Request to /api/v1/credentials/revoke")
    
    try:
        body = await request.json()
        credential_id = body.get("credential_id")
        reason = body.get("reason", "No reason provided")
        
        if not credential_id:
            raise HTTPException(status_code=400, detail="credential_id is required")
        
        # In a real implementation, you would revoke the credential
        # For this mock, we'll return a success response
        return {
            "revoked": True,
            "credential_id": credential_id,
            "timestamp": datetime.now().isoformat(),
            "reason": reason
        }
    except Exception as e:
        logger.error(f"Error revoking credential: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# New endpoint for listing all CosmWasm contracts
@app.get("/api/v1/contracts")
async def get_contracts():
    """Get list of all CosmWasm contracts deployed on the chain"""
    logger.info("Request to /api/v1/contracts")
    
    try:
        # Try to get real data from Cosmos REST API
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{COSMOS_REST_URL}/cosmwasm/wasm/v1/contract")
            
            if response.status_code == 200:
                contracts_data = response.json()
                
                # Format the response
                contracts = []
                for contract in contracts_data.get("contracts", []):
                    contracts.append({
                        "address": contract.get("address"),
                        "code_id": contract.get("code_id"),
                        "creator": contract.get("creator"),
                        "admin": contract.get("admin", ""),
                        "label": contract.get("label", ""),
                        # You would need to determine the contract type/name based on your application logic
                        "name": "Unknown",
                        "type": "Unknown"
                    })
                
                return {"contracts": contracts}
    except Exception as e:
        logger.warning(f"Error fetching contracts from Cosmos REST API: {str(e)}")
        logger.info("Returning mock data")
    
    # Return mock data if we couldn't get real data
    return {"contracts": MOCK_DATA["contracts"]}

# New endpoint for getting details about a specific contract
@app.get("/api/v1/contracts/{address}")
async def get_contract_by_address(address: str = Path(..., description="Contract address")):
    """Get detailed information about a specific CosmWasm contract"""
    logger.info(f"Request to /api/v1/contracts/{address}")
    
    try:
        # Try to get real data from Cosmos REST API
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Get contract info
            response = await client.get(f"{COSMOS_REST_URL}/cosmwasm/wasm/v1/contract/{address}")
            
            if response.status_code == 200:
                contract_data = response.json().get("contract_info", {})
                
                # Get contract history
                history_response = await client.get(f"{COSMOS_REST_URL}/cosmwasm/wasm/v1/contract/{address}/history")
                history = history_response.json().get("entries", []) if history_response.status_code == 200 else []
                
                # Get contract state
                state_response = await client.get(f"{COSMOS_REST_URL}/cosmwasm/wasm/v1/contract/{address}/state")
                state = state_response.json().get("models", []) if state_response.status_code == 200 else []
                
                # Format the response
                result = {
                    "address": address,
                    "code_id": contract_data.get("code_id"),
                    "creator": contract_data.get("creator"),
                    "admin": contract_data.get("admin", ""),
                    "label": contract_data.get("label", ""),
                    "created_at": contract_data.get("created", ""),
                    "ibc_port_id": contract_data.get("ibc_port_id", ""),
                    "history": history,
                    "state_size": len(state)
                }
                
                # You would need to determine the contract type/name based on your application logic
                # For example, by checking the code_id or patterns in the label/state
                
                return result
    except Exception as e:
        logger.warning(f"Error fetching contract {address} from Cosmos REST API: {str(e)}")
        logger.info("Returning mock data")
    
    # Return mock data if we couldn't get real data
    # Find the contract in our mock data
    for contract in MOCK_DATA["contracts"]:
        if contract["address"] == address:
            return contract
    
    # If contract not found in mock data
    raise HTTPException(status_code=404, detail=f"Contract {address} not found")

# Add backward compatibility routes
@app.get("/nodeinfo")
async def legacy_node_info():
    """Legacy endpoint for node info"""
    return await node_info()

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.getenv("PORT", "1318"))
    
    # Print startup banner
    print(f"Starting FastAPI server on http://0.0.0.0:{port}")
    print(f"API documentation available at http://0.0.0.0:{port}/docs")
    
    # Run the server
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
