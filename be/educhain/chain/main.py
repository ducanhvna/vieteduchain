#!/usr/bin/env python3
"""
FastAPI implementation of the Custom REST API for Cosmos Permissioned Network
This replaces the Go implementation with a Python-based FastAPI version
"""

from fastapi import FastAPI, HTTPException, Request, Path, Query, Body, Depends, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import httpx
import uvicorn
import os
import sys
import subprocess
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
import logging
from logging.handlers import RotatingFileHandler
import asyncio
import time
import psutil
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
from pydantic import BaseModel, Field, validator, root_validator
import uuid
from minio import Minio
from minio.error import S3Error
import base64
from enum import Enum
import re
import io

# Thêm thư mục hiện tại vào PYTHONPATH để import được các module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.did_models import *
from routes.did_routes import router as did_router

# Configure advanced logging
LOG_FILE = os.getenv("LOG_FILE", "/var/log/fastapi_detailed.log")
MAX_LOG_SIZE = 10 * 1024 * 1024  # 10 MB
BACKUP_COUNT = 5

# Set up rotating file handler
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=MAX_LOG_SIZE,
    backupCount=BACKUP_COUNT
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        file_handler
    ]
)

logger = logging.getLogger("educhain-api")

# Constants
COSMOS_REST_API = os.environ.get("COSMOS_REST_API", "http://localhost:1317")
TENDERMINT_RPC = os.environ.get("TENDERMINT_RPC", "http://localhost:26657")
CHAIN_ID = os.environ.get("CHAIN_ID", "educhain")
DENOM = os.environ.get("DENOM", "stake")
GAS_PRICE = os.environ.get("GAS_PRICE", "0.025")
GAS_ADJUSTMENT = os.environ.get("GAS_ADJUSTMENT", "1.3")

# MinIO Configuration
MINIO_ENDPOINT = os.environ.get("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.environ.get("MINIO_SECRET_KEY", "minioadmin")
MINIO_SECURE = os.environ.get("MINIO_SECURE", "false").lower() == "true"
MINIO_BUCKET = os.environ.get("MINIO_BUCKET", "educhain-entities")

# Initialize MinIO client
try:
    minio_client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE
    )
    
    # Create bucket if it doesn't exist
    if not minio_client.bucket_exists(MINIO_BUCKET):
        minio_client.make_bucket(MINIO_BUCKET)
        logger.info(f"Created MinIO bucket: {MINIO_BUCKET}")
    logger.info("MinIO client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize MinIO client: {str(e)}")
    minio_client = None

# Create Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP Requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP Request Latency', ['method', 'endpoint'])
NODE_HEIGHT = Gauge('node_latest_block_height', 'Latest Block Height')
NODE_PEERS = Gauge('node_connected_peers', 'Number of Connected Peers')
API_UP = Gauge('api_up', 'API is up and running')
SYSTEM_MEMORY = Gauge('system_memory_usage_bytes', 'System Memory Usage in Bytes')
SYSTEM_CPU = Gauge('system_cpu_usage_percent', 'System CPU Usage Percentage')
TENDERMINT_UP = Gauge('tendermint_up', 'Tendermint is up and running')
COSMOS_REST_UP = Gauge('cosmos_rest_up', 'Cosmos REST API is up and running')
WASMD_UP = Gauge('wasmd_up', 'wasmd is up and running')

# Create FastAPI app
app = FastAPI(
    title="EduChain API",
    description="REST API for EduChain Educational Blockchain",
    version="1.0.0",
)

app.include_router(did_router)

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
WASMD_HOME = os.getenv("DAEMON_HOME", "/root/.wasmd")

# Last successful health check timestamp
last_successful_health_check = None

# Background task to update metrics
async def update_metrics():
    """Update Prometheus metrics"""
    try:
        # Update system metrics
        SYSTEM_MEMORY.set(psutil.virtual_memory().used)
        SYSTEM_CPU.set(psutil.cpu_percent())
        
        # Update node metrics
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                # Check Tendermint RPC
                response = await client.get(f"{TENDERMINT_RPC_URL}/status")
                if response.status_code == 200:
                    data = response.json()
                    NODE_HEIGHT.set(int(data["result"]["sync_info"]["latest_block_height"]))
                    TENDERMINT_UP.set(1)
                else:
                    TENDERMINT_UP.set(0)
                
                # Check Cosmos REST API
                response = await client.get(f"{COSMOS_REST_URL}/node_info")
                if response.status_code == 200:
                    COSMOS_REST_UP.set(1)
                else:
                    COSMOS_REST_UP.set(0)
                
                # Check net info for peers
                response = await client.get(f"{TENDERMINT_RPC_URL}/net_info")
                if response.status_code == 200:
                    data = response.json()
                    NODE_PEERS.set(int(data["result"]["n_peers"]))
        except Exception as e:
            logger.error(f"Error updating node metrics: {str(e)}")
            TENDERMINT_UP.set(0)
            COSMOS_REST_UP.set(0)
        
        # Check if wasmd is running
        try:
            result = subprocess.run(["pgrep", "-f", "wasmd start"], capture_output=True, text=True)
            WASMD_UP.set(1 if result.returncode == 0 else 0)
        except Exception as e:
            logger.error(f"Error checking wasmd process: {str(e)}")
            WASMD_UP.set(0)
        
        # API is up
        API_UP.set(1)
    except Exception as e:
        logger.error(f"Error in update_metrics: {str(e)}")
        API_UP.set(0)

# Middleware to track request metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Default to 500 in case of unhandled errors
    status_code = 500
    
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        raise
    finally:
        # Record request latency
        latency = time.time() - start_time
        endpoint = request.url.path
        REQUEST_LATENCY.labels(request.method, endpoint).observe(latency)
        REQUEST_COUNT.labels(request.method, endpoint, status_code).inc()

# Create a global httpx client for reuse
@app.on_event("startup")
async def startup_event():
    app.state.http_client = httpx.AsyncClient(timeout=10.0)
    # Record startup time
    app.state.startup_time = datetime.now()
    # Initial health check of dependent services
    await check_dependent_services()
    # Update metrics
    await update_metrics()
    
    # Log startup information
    logger.info(f"EduChain API started successfully")
    logger.info(f"Tendermint RPC URL: {TENDERMINT_RPC_URL}")
    logger.info(f"Cosmos REST URL: {COSMOS_REST_URL}")
    logger.info(f"WASMD_HOME: {WASMD_HOME}")

@app.on_event("shutdown")
async def shutdown_event():
    await app.state.http_client.aclose()
    logger.info("EduChain API shutting down")

async def check_dependent_services():
    """Check if dependent services are available"""
    global last_successful_health_check
    
    services_status = {"tendermint_rpc": False, "cosmos_rest": False}
    
    # Check Tendermint RPC
    try:
        response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/health")
        if response.status_code == 200:
            logger.info(f"Tendermint RPC service is available at {TENDERMINT_RPC_URL}")
            services_status["tendermint_rpc"] = True
        else:
            logger.warning(f"Tendermint RPC service returned status {response.status_code}")
    except Exception as e:
        logger.warning(f"Tendermint RPC service check failed: {str(e)}")
    
    # Check Cosmos REST API
    try:
        response = await app.state.http_client.get(f"{COSMOS_REST_URL}/node_info")
        if response.status_code == 200:
            logger.info(f"Cosmos REST API is available at {COSMOS_REST_URL}")
            services_status["cosmos_rest"] = True
        else:
            logger.warning(f"Cosmos REST API returned status {response.status_code}")
    except Exception as e:
        logger.warning(f"Cosmos REST API check failed: {str(e)}")
    
    # Update last successful health check if all services are available
    if all(services_status.values()):
        last_successful_health_check = datetime.now()
    
    return services_status

# Basic routes
@app.get("/api/v1/nodeinfo")
async def get_node_info():
    """Get node information including version, network, and validator details"""
    try:
        # Call Tendermint RPC
        response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/status")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to get node status")
        
        data = response.json()
        
        # Extract relevant info
        node_info = {
            "node_id": data["result"]["node_info"]["id"],
            "network": data["result"]["node_info"]["network"],
            "version": data["result"]["node_info"]["version"],
            "channels": data["result"]["node_info"]["channels"],
            "moniker": data["result"]["node_info"]["moniker"],
            "other": data["result"]["node_info"]["other"],
            "application_version": {
                "name": "wasmd",
                "server_name": "wasmd",
                "version": data["result"]["node_info"]["version"],
                "git_commit": "",
                "build_tags": "netgo",
                "go_version": "go version go1.19.13 linux/amd64"
            },
            "latest_block_height": data["result"]["sync_info"]["latest_block_height"],
            "catching_up": data["result"]["sync_info"]["catching_up"]
        }
        
        return node_info
    except Exception as e:
        logger.error(f"Error getting node info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/health")
async def health_check(background_tasks: BackgroundTasks):
    """Health check endpoint with detailed service status"""
    global last_successful_health_check
    
    # Get uptime
    uptime = datetime.now() - app.state.startup_time
    
    # Update metrics in the background
    background_tasks.add_task(update_metrics)
    
    # Check if wasmd is running
    wasmd_running = False
    try:
        result = subprocess.run(["pgrep", "-f", "wasmd start"], capture_output=True, text=True)
        wasmd_running = result.returncode == 0
    except Exception as e:
        logger.error(f"Error checking wasmd process: {str(e)}")
    
    # Check dependent services
    services_status = await check_dependent_services()
    
    # Get system resource usage
    try:
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
        disk = psutil.disk_usage('/')
    except Exception as e:
        logger.error(f"Error getting system resources: {str(e)}")
        memory = None
        cpu_percent = None
        disk = None
    
    # Determine overall health status
    all_critical_services_up = wasmd_running and services_status["tendermint_rpc"] 
    status = "ok" if all_critical_services_up else "degraded"
    
    # If it's been more than 5 minutes since last successful health check and we're not healthy now
    if (last_successful_health_check is None or 
        (datetime.now() - last_successful_health_check > timedelta(minutes=5)) and 
        not all_critical_services_up):
        status = "critical"
    
    # If all is well, update the last successful health check
    if all_critical_services_up:
        last_successful_health_check = datetime.now()
    
    health_data = {
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": int(uptime.total_seconds()),
        "services": {
            "wasmd": "running" if wasmd_running else "not_detected",
            "tendermint_rpc": "healthy" if services_status["tendermint_rpc"] else "unhealthy",
            "cosmos_rest": "healthy" if services_status["cosmos_rest"] else "unhealthy"
        },
        "last_successful_health_check": last_successful_health_check.isoformat() if last_successful_health_check else None
    }
    
    # Include system resources if available
    if memory and cpu_percent and disk:
        health_data["system"] = {
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent
            },
            "cpu_percent": cpu_percent,
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            }
        }
    
    # Return appropriate status code based on health
    status_code = 200 if status == "ok" else 503
    return JSONResponse(content=health_data, status_code=status_code)

@app.get("/api/v1/blocks/latest")
async def get_latest_block():
    """Get information about the latest block"""
    try:
        response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/block")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to get latest block")
        
        data = response.json()
        return data["result"]
    except Exception as e:
        logger.error(f"Error getting latest block: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/blocks/{height}")
async def get_block_by_height(height: int = Path(..., description="Block height")):
    """Get information about a specific block by height"""
    try:
        response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/block?height={height}")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Failed to get block at height {height}")
        
        data = response.json()
        return data["result"]
    except Exception as e:
        logger.error(f"Error getting block at height {height}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/metrics")
async def get_node_metrics():
    """Get node metrics including validator status, connected peers, etc."""
    try:
        # Get status
        status_response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/status")
        status_data = status_response.json()
        
        # Get net info
        net_info_response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/net_info")
        net_info_data = net_info_response.json()
        
        # Get validator info
        validators_response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/validators")
        validators_data = validators_response.json()
        
        # Compile metrics
        metrics = {
            "chain_id": status_data["result"]["node_info"]["network"],
            "latest_block_height": status_data["result"]["sync_info"]["latest_block_height"],
            "latest_block_time": status_data["result"]["sync_info"]["latest_block_time"],
            "catching_up": status_data["result"]["sync_info"]["catching_up"],
            "voting_power": status_data["result"]["validator_info"]["voting_power"],
            "peers": {
                "n_peers": net_info_data["result"]["n_peers"],
                "connected_peers": [
                    {
                        "node_id": peer["node_info"]["id"],
                        "moniker": peer["node_info"]["moniker"],
                        "remote_ip": peer["remote_ip"]
                    }
                    for peer in net_info_data["result"]["peers"]
                ]
            },
            "validators": {
                "count": validators_data["result"]["total"],
                "total_voting_power": sum(int(v["voting_power"]) for v in validators_data["result"]["validators"])
            }
        }
        
        return metrics
    except Exception as e:
        logger.error(f"Error getting node metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/transactions/{hash}")
async def get_transaction(hash: str = Path(..., description="Transaction hash")):
    """Get transaction details by hash"""
    try:
        # Convert hash to uppercase if needed
        hash = hash.upper()
        
        # Query transaction
        response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/tx?hash=0x{hash}")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Failed to get transaction with hash {hash}")
        
        data = response.json()
        if "error" in data:
            raise HTTPException(status_code=404, detail=f"Transaction not found: {hash}")
        
        return data["result"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction {hash}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/prometheus", response_class=Response)
async def prometheus_metrics():
    """Expose Prometheus metrics"""
    # Update metrics before serving
    await update_metrics()
    
    # Generate and serve metrics in Prometheus format
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/api/v1/validators")
async def get_validators():
    """Get information about current validators"""
    try:
        response = await app.state.http_client.get(f"{TENDERMINT_RPC_URL}/validators")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to get validators")
        
        data = response.json()
        return data["result"]
    except Exception as e:
        logger.error(f"Error getting validators: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/genesis")
async def get_genesis():
    """Get genesis file information"""
    try:
        # This is a large file, so we'll just read it directly from disk
        genesis_path = os.path.join(WASMD_HOME, "config", "genesis.json")
        
        if not os.path.exists(genesis_path):
            raise HTTPException(status_code=404, detail=f"Genesis file not found at {genesis_path}")
            
        try:
            with open(genesis_path, 'r') as f:
                genesis_data = json.load(f)
            
            # Return a summary instead of the full file which could be very large
            return {
                "app_hash": genesis_data.get("app_hash", ""),
                "chain_id": genesis_data.get("chain_id", ""),
                "genesis_time": genesis_data.get("genesis_time", ""),
                "initial_height": genesis_data.get("initial_height", ""),
                "consensus_params": genesis_data.get("consensus_params", {}),
                "validators_count": len(genesis_data.get("validators", [])),
                "app_state_summary": {key: "..." for key in genesis_data.get("app_state", {}).keys()}
            }
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Invalid genesis file format")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading genesis file: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting genesis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ===================== DID and Entity Models =====================

# (Moved to did_models.py)

# ====================== Request/Response Models ======================

# (Moved to did_models.py)

# ===================== Utility Functions =====================

def calculate_hash(data: Dict[str, Any]) -> str:
    """Calculate SHA-256 hash of the data"""
    data_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(data_str.encode()).hexdigest()

def validate_did(did: str) -> bool:
    """Validate DID format"""
    return bool(re.match(r'^did:[a-z0-9]+:[a-zA-Z0-9.%-]+$', did))

def generate_random_did(method: str = "eduid", entity_type: str = None) -> str:
    """Generate a random DID"""
    unique_id = uuid.uuid4().hex
    if entity_type:
        return f"did:{method}:{entity_type.lower()}-{unique_id[:16]}"
    return f"did:{method}:{unique_id[:16]}"

async def store_entity_data(did: str, entity_data: Dict[str, Any]) -> str:
    """Store entity data in MinIO"""
    if not minio_client:
        raise HTTPException(status_code=500, detail="MinIO client not initialized")
    
    # Calculate hash for data integrity
    data_hash = calculate_hash(entity_data)
    entity_data["metadata"] = entity_data.get("metadata", {})
    entity_data["metadata"]["hash"] = data_hash
    
    # Determine the appropriate folder based on entity type
    entity_type = entity_data.get("type", "Unknown")
    object_name = f"{entity_type.lower()}/{did}.json"
    
    try:
        data_bytes = json.dumps(entity_data).encode('utf-8')
        minio_client.put_object(
            bucket_name=MINIO_BUCKET,
            object_name=object_name,
            data=io.BytesIO(data_bytes),
            length=len(data_bytes),
            content_type="application/json"
        )
        logger.info(f"Entity data for {did} stored successfully")
        return data_hash
    except Exception as e:
        logger.error(f"Failed to store entity data for {did}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store entity data: {str(e)}")

async def retrieve_entity_data(did: str) -> Dict[str, Any]:
    """Retrieve entity data from MinIO"""
    if not minio_client:
        raise HTTPException(status_code=500, detail="MinIO client not initialized")
    
    # First try to find the object in any possible folder
    entity_types = [t.lower() for t in EntityType.__members__.values()]
    
    for entity_type in entity_types:
        object_name = f"{entity_type}/{did}.json"
        try:
            response = minio_client.get_object(MINIO_BUCKET, object_name)
            data = json.loads(response.read().decode('utf-8'))
            response.close()
            response.release_conn()
            logger.info(f"Entity data for {did} retrieved successfully")
            return data
        except S3Error as e:
            if e.code == 'NoSuchKey':
                continue
            else:
                logger.error(f"Failed to retrieve entity data for {did}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to retrieve entity data: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to retrieve entity data for {did}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve entity data: {str(e)}")
    
    # If we get here, the entity was not found in any folder
    logger.warning(f"Entity data for {did} not found")
    raise HTTPException(status_code=404, detail=f"Entity data for {did} not found")

async def update_entity_data(did: str, entity_data: Dict[str, Any]) -> str:
    """Update entity data in MinIO"""
    # First retrieve existing data to know which folder it's in
    try:
        existing_data = await retrieve_entity_data(did)
        entity_type = existing_data.get("type", "Unknown")
        
        # Update metadata
        entity_data["metadata"] = entity_data.get("metadata", existing_data.get("metadata", {}))
        entity_data["metadata"]["updated_at"] = datetime.now().isoformat()
        
        # Merge with existing data
        merged_data = {**existing_data, **entity_data}
        
        # Calculate new hash
        data_hash = calculate_hash(merged_data)
        merged_data["metadata"]["hash"] = data_hash
        
        # Store updated data
        object_name = f"{entity_type.lower()}/{did}.json"
        data_bytes = json.dumps(merged_data).encode('utf-8')
        
        minio_client.put_object(
            bucket_name=MINIO_BUCKET,
            object_name=object_name,
            data=io.BytesIO(data_bytes),
            length=len(data_bytes),
            content_type="application/json"
        )
        logger.info(f"Entity data for {did} updated successfully")
        return data_hash
    except HTTPException as e:
        if e.status_code == 404:
            # If entity doesn't exist, create it
            return await store_entity_data(did, entity_data)
        raise
    except Exception as e:
        logger.error(f"Failed to update entity data for {did}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update entity data: {str(e)}")

async def delete_entity_data(did: str) -> bool:
    """Delete entity data from MinIO"""
    if not minio_client:
        raise HTTPException(status_code=500, detail="MinIO client not initialized")
    
    # First try to find the object in any possible folder
    entity_types = [t.lower() for t in EntityType.__members__.values()]
    
    for entity_type in entity_types:
        object_name = f"{entity_type}/{did}.json"
        try:
            minio_client.remove_object(MINIO_BUCKET, object_name)
            logger.info(f"Entity data for {did} deleted successfully")
            return True
        except S3Error as e:
            if e.code == 'NoSuchKey':
                continue
            else:
                logger.error(f"Failed to delete entity data for {did}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to delete entity data: {str(e)}")
    
    # If we get here, the entity was not found in any folder
    logger.warning(f"Entity data for {did} not found for deletion")
    raise HTTPException(status_code=404, detail=f"Entity data for {did} not found for deletion")

async def list_entities(
    entity_type: Optional[EntityType] = None,
    entity_subtype: Optional[EntitySubtype] = None,
    status: Optional[DIDStatus] = None,
    page: int = 1,
    limit: int = 10
) -> PaginatedResponse:
    """List entities from MinIO with pagination"""
    if not minio_client:
        raise HTTPException(status_code=500, detail="MinIO client not initialized")
    
    if entity_type:
        # If entity type is specified, only check that folder
        prefixes = [f"{entity_type.lower()}/"]
    else:
        # Otherwise check all entity type folders
        prefixes = [f"{t.lower()}/" for t in EntityType.__members__.values()]
    
    results = []
    total_count = 0
    
    for prefix in prefixes:
        objects = minio_client.list_objects(MINIO_BUCKET, prefix=prefix, recursive=True)
        for obj in objects:
            total_count += 1
            # Only process objects within the requested page range
            if (page - 1) * limit < total_count <= page * limit:
                try:
                    response = minio_client.get_object(MINIO_BUCKET, obj.object_name)
                    data = json.loads(response.read().decode('utf-8'))
                    response.close()
                    response.release_conn()
                    
                    # Apply filters
                    if entity_subtype and data.get("subtype") != entity_subtype:
                        continue
                    
                    if status and data.get("metadata", {}).get("status") != status:
                        continue
                    
                    results.append(data)
                except Exception as e:
                    logger.error(f"Error processing object {obj.object_name}: {str(e)}")
    
    return PaginatedResponse(
        items=results,
        total=total_count,
        page=page,
        limit=limit,
        has_next=total_count > page * limit
    )

async def verify_on_chain_did(did: str) -> Dict[str, Any]:
    """Verify if a DID exists on-chain by querying the smart contract"""
    try:
        contract_address = os.environ.get("EDUID_CONTRACT_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="EDUID_CONTRACT_ADDRESS environment variable not set")
        
        query_msg = {
            "get_did_document": {
                "did": did
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/smart/{base64.b64encode(json.dumps(query_msg).encode()).decode()}"
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to query DID document: {response.text}"
                )
            
            result = response.json()
            return result.get("data", {})
    except Exception as e:
        logger.error(f"Error verifying on-chain DID {did}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error verifying on-chain DID: {str(e)}")

async def check_data_integrity(did: str) -> bool:
    """Check data integrity by comparing on-chain hash with off-chain data hash"""
    try:
        # Get on-chain DID document
        on_chain_data = await verify_on_chain_did(did)
        on_chain_hash = on_chain_data.get("metadata", {}).get("hash")
        
        if not on_chain_hash:
            return False
        
        # Get off-chain entity data
        off_chain_data = await retrieve_entity_data(did)
        off_chain_hash = off_chain_data.get("metadata", {}).get("hash")
        
        if not off_chain_hash:
            return False
        
        # Compare hashes
        return on_chain_hash == off_chain_hash
    except Exception as e:
        logger.error(f"Error checking data integrity for {did}: {str(e)}")
        return False

# ===================== Blockchain Interaction Functions =====================

async def get_account_info(address: str) -> Dict[str, Any]:
    """Get account information from the blockchain"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{COSMOS_REST_API}/cosmos/auth/v1beta1/accounts/{address}")
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to get account info: {response.text}"
                )
            return response.json().get("account", {})
    except Exception as e:
        logger.error(f"Error getting account info for {address}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting account info: {str(e)}")

async def estimate_gas(tx_bytes: str) -> int:
    """Estimate gas for a transaction"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COSMOS_REST_API}/cosmos/tx/v1beta1/simulate",
                json={"tx_bytes": tx_bytes}
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to simulate transaction: {response.text}"
                )
            gas_used = int(response.json().get("gas_info", {}).get("gas_used", "0"))
            return int(float(gas_used) * float(GAS_ADJUSTMENT))
    except Exception as e:
        logger.error(f"Error estimating gas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error estimating gas: {str(e)}")

async def broadcast_transaction(tx_bytes: str) -> Dict[str, Any]:
    """Broadcast a transaction to the blockchain"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COSMOS_REST_API}/cosmos/tx/v1beta1/txs",
                json={"tx_bytes": tx_bytes, "mode": "BROADCAST_MODE_BLOCK"}
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to broadcast transaction: {response.text}"
                )
            return response.json()
    except Exception as e:
        logger.error(f"Error broadcasting transaction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error broadcasting transaction: {str(e)}")

async def create_did_on_chain(request: CreateDIDRequest, sender_address: str) -> Dict[str, Any]:
    """Create a new DID on-chain by executing a smart contract transaction"""
    try:
        contract_address = os.environ.get("EDUID_CONTRACT_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="EDUID_CONTRACT_ADDRESS environment variable not set")
        
        # Generate DID if not provided
        did = generate_random_did(
            method=request.method, 
            entity_type=request.entity_type.lower()
        )
        
        # Prepare verification method
        verification_method = {
            "id": f"{did}#key-1",
            "type": "EcdsaSecp256k1VerificationKey2019",
            "controller": request.controller,
            "publicKeyMultibase": request.public_key
        }
        
        # Prepare services if provided
        services = request.services or []
        
        # Prepare execute message
        execute_msg = {
            "register_did": {
                "did": did,
                "controller": request.controller,
                "verification_method": verification_method,
                "authentication": [f"{did}#key-1"],
                "services": services,
                "metadata": {
                    "entity_type": request.entity_type,
                    "entity_subtype": request.entity_subtype,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "status": "active"
                }
            }
        }
        
        # Execute the transaction (simplified for example)
        # In a real implementation, you would need to handle:
        # 1. Building the transaction with proper account sequence/number
        # 2. Signing the transaction with the sender's private key
        # 3. Broadcasting the signed transaction
        
        # For this example, we'll assume there's a backend wallet service
        # that handles the signing and broadcasting
        
        # Simulate execute message to get gas estimation
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/execute",
                json={
                    "sender": sender_address,
                    "msg": execute_msg,
                    "funds": []
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to execute contract: {response.text}"
                )
            
            result = response.json()
            
            # If we have entity data, store it off-chain
            if request.entity_data:
                # Add DID to entity data
                entity_data = request.entity_data
                entity_data["did"] = did
                entity_data["type"] = request.entity_type
                entity_data["subtype"] = request.entity_subtype
                entity_data["metadata"] = {
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "status": "active"
                }
                
                # Store entity data in MinIO
                data_hash = await store_entity_data(did, entity_data)
                
                # Update on-chain metadata with the hash of entity data
                update_msg = {
                    "update_did_metadata": {
                        "did": did,
                        "metadata": {
                            "hash": data_hash
                        }
                    }
                }
                
                # Execute the update transaction
                update_response = await client.post(
                    f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/execute",
                    json={
                        "sender": sender_address,
                        "msg": update_msg,
                        "funds": []
                    }
                )
                
                if update_response.status_code != 200:
                    # If update fails, we should still return the DID but log the error
                    logger.error(f"Failed to update DID metadata with hash: {update_response.text}")
            
            # Return the created DID and transaction result
            return {
                "did": did,
                "transaction_hash": result.get("txhash"),
                "status": "success",
                "message": "DID created successfully"
            }
            
    except Exception as e:
        logger.error(f"Error creating DID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating DID: {str(e)}")

async def update_did_on_chain(request: UpdateDIDRequest, sender_address: str) -> Dict[str, Any]:
    """Update a DID on-chain"""
    try:
        contract_address = os.environ.get("EDUID_CONTRACT_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="EDUID_CONTRACT_ADDRESS environment variable not set")
        
        # Prepare update message based on the requested changes
        update_msg = {"update_did": {"did": request.did}}
        
        if request.controller:
            update_msg["update_did"]["new_controller"] = request.controller
        
        if request.add_verification_method:
            update_msg["update_did"]["add_verification_method"] = request.add_verification_method
        
        if request.remove_verification_method:
            update_msg["update_did"]["remove_verification_method"] = request.remove_verification_method
        
        if request.add_service:
            update_msg["update_did"]["add_service"] = request.add_service
        
        if request.remove_service:
            update_msg["update_did"]["remove_service"] = request.remove_service
        
        if request.add_authentication:
            update_msg["update_did"]["add_authentication"] = request.add_authentication
        
        if request.remove_authentication:
            update_msg["update_did"]["remove_authentication"] = request.remove_authentication
        
        # Execute the update transaction
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/execute",
                json={
                    "sender": sender_address,
                    "msg": update_msg,
                    "funds": []
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to update DID: {response.text}"
                )
            
            result = response.json()
            
            # If we have entity data, update it off-chain
            if request.entity_data:
                # Update entity data in MinIO
                entity_data = request.entity_data
                entity_data["metadata"] = entity_data.get("metadata", {})
                entity_data["metadata"]["updated_at"] = datetime.now().isoformat()
                
                data_hash = await update_entity_data(request.did, entity_data)
                
                # Update on-chain metadata with the new hash
                update_metadata_msg = {
                    "update_did_metadata": {
                        "did": request.did,
                        "metadata": {
                            "hash": data_hash,
                            "updated_at": datetime.now().isoformat()
                        }
                    }
                }
                
                # Execute the metadata update transaction
                update_response = await client.post(
                    f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/execute",
                    json={
                        "sender": sender_address,
                        "msg": update_metadata_msg,
                        "funds": []
                    }
                )
                
                if update_response.status_code != 200:
                    # Log error but continue since the main update was successful
                    logger.error(f"Failed to update DID metadata with hash: {update_response.text}")
            
            # Return transaction result
            return {
                "did": request.did,
                "transaction_hash": result.get("txhash"),
                "status": "success",
                "message": "DID updated successfully"
            }
            
    except Exception as e:
        logger.error(f"Error updating DID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating DID: {str(e)}")

async def revoke_did_on_chain(request: RevokeDIDRequest, sender_address: str) -> Dict[str, Any]:
    """Revoke a DID on-chain"""
    try:
        contract_address = os.environ.get("EDUID_CONTRACT_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="EDUID_CONTRACT_ADDRESS environment variable not set")
        
        # Prepare revoke message
        revoke_msg = {
            "revoke_did": {
                "did": request.did,
                "reason": request.reason or "Revoked by controller"
            }
        }
        
        # Execute the revoke transaction
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/execute",
                json={
                    "sender": sender_address,
                    "msg": revoke_msg,
                    "funds": []
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to revoke DID: {response.text}"
                )
            
            result = response.json()
            
            # Update off-chain entity data status
            try:
                entity_data = await retrieve_entity_data(request.did)
                entity_data["metadata"]["status"] = "revoked"
                entity_data["metadata"]["updated_at"] = datetime.now().isoformat()
                if request.reason:
                    entity_data["metadata"]["revocation_reason"] = request.reason
                
                await update_entity_data(request.did, entity_data)
            except Exception as e:
                # Log error but continue since the main revocation was successful
                logger.error(f"Failed to update off-chain entity data status: {str(e)}")
            
            # Return transaction result
            return {
                "did": request.did,
                "transaction_hash": result.get("txhash"),
                "status": "success",
                "message": "DID revoked successfully"
            }
            
    except Exception as e:
        logger.error(f"Error revoking DID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error revoking DID: {str(e)}")

async def transfer_did_on_chain(request: TransferDIDRequest, sender_address: str) -> Dict[str, Any]:
    """Transfer a DID to a new controller"""
    try:
        contract_address = os.environ.get("EDUID_CONTRACT_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="EDUID_CONTRACT_ADDRESS environment variable not set")
        
        # Prepare transfer message
        transfer_msg = {
            "transfer_did": {
                "did": request.did,
                "new_controller": request.new_controller
            }
        }
        
        if request.new_public_key:
            transfer_msg["transfer_did"]["new_public_key"] = request.new_public_key
        
        # Execute the transfer transaction
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/execute",
                json={
                    "sender": sender_address,
                    "msg": transfer_msg,
                    "funds": []
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to transfer DID: {response.text}"
                )
            
            result = response.json()
            
            # Update off-chain entity data
            try:
                entity_data = await retrieve_entity_data(request.did)
                entity_data["owner_address"] = request.new_controller
                entity_data["metadata"]["updated_at"] = datetime.now().isoformat()
                entity_data["metadata"]["transfer_history"] = entity_data["metadata"].get("transfer_history", [])
                entity_data["metadata"]["transfer_history"].append({
                    "previous_controller": sender_address,
                    "new_controller": request.new_controller,
                    "timestamp": datetime.now().isoformat()
                })
                
                await update_entity_data(request.did, entity_data)
            except Exception as e:
                # Log error but continue since the main transfer was successful
                logger.error(f"Failed to update off-chain entity data after transfer: {str(e)}")
            
            # Return transaction result
            return {
                "did": request.did,
                "transaction_hash": result.get("txhash"),
                "status": "success",
                "message": "DID transferred successfully"
            }
            
    except Exception as e:
        logger.error(f"Error transferring DID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error transferring DID: {str(e)}")

async def link_dids_on_chain(request: LinkDIDsRequest, sender_address: str) -> Dict[str, Any]:
    """Link two DIDs with a specified relationship"""
    try:
        contract_address = os.environ.get("EDUID_CONTRACT_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="EDUID_CONTRACT_ADDRESS environment variable not set")
        
        # Prepare link message
        link_msg = {
            "link_dids": {
                "source_did": request.source_did,
                "target_did": request.target_did,
                "relationship": request.relationship
            }
        }
        
        # Execute the link transaction
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/execute",
                json={
                    "sender": sender_address,
                    "msg": link_msg,
                    "funds": []
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to link DIDs: {response.text}"
                )
            
            result = response.json()
            
            # Update off-chain entity data for both DIDs
            try:
                # Update source DID
                source_data = await retrieve_entity_data(request.source_did)
                source_data["linked_dids"] = source_data.get("linked_dids", [])
                source_data["linked_dids"].append({
                    "did": request.target_did,
                    "relationship": request.relationship
                })
                source_data["metadata"]["updated_at"] = datetime.now().isoformat()
                await update_entity_data(request.source_did, source_data)
                
                # Update target DID with inverse relationship
                target_data = await retrieve_entity_data(request.target_did)
                target_data["linked_dids"] = target_data.get("linked_dids", [])
                
                # Determine inverse relationship
                inverse_relationship = None
                if request.relationship == RelationshipType.ENROLLED_AT:
                    inverse_relationship = "has_student"
                elif request.relationship == RelationshipType.EMPLOYED_BY:
                    inverse_relationship = "employs"
                elif request.relationship == RelationshipType.ISSUED_BY:
                    inverse_relationship = RelationshipType.ISSUED_TO
                elif request.relationship == RelationshipType.ISSUED_TO:
                    inverse_relationship = RelationshipType.ISSUED_BY
                elif request.relationship == RelationshipType.CREATED_BY:
                    inverse_relationship = "created"
                elif request.relationship == RelationshipType.OWNS:
                    inverse_relationship = "owned_by"
                elif request.relationship == RelationshipType.HAS_DEPARTMENT:
                    inverse_relationship = RelationshipType.BELONGS_TO
                elif request.relationship == RelationshipType.BELONGS_TO:
                    inverse_relationship = RelationshipType.HAS_DEPARTMENT
                
                if inverse_relationship:
                    target_data["linked_dids"].append({
                        "did": request.source_did,
                        "relationship": inverse_relationship
                    })
                    target_data["metadata"]["updated_at"] = datetime.now().isoformat()
                    await update_entity_data(request.target_did, target_data)
            except Exception as e:
                # Log error but continue since the main link was successful
                logger.error(f"Failed to update off-chain entity data after linking: {str(e)}")
            
            # Return transaction result
            return {
                "source_did": request.source_did,
                "target_did": request.target_did,
                "relationship": request.relationship,
                "transaction_hash": result.get("txhash"),
                "status": "success",
                "message": "DIDs linked successfully"
            }
            
    except Exception as e:
        logger.error(f"Error linking DIDs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error linking DIDs: {str(e)}")

async def query_did_on_chain(did: str) -> Dict[str, Any]:
    """Query a DID document from the blockchain"""
    try:
        contract_address = os.environ.get("EDUID_CONTRACT_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="EDUID_CONTRACT_ADDRESS environment variable not set")
        
        query_msg = {
            "get_did_document": {
                "did": did
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/smart/{base64.b64encode(json.dumps(query_msg).encode()).decode()}"
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to query DID document: {response.text}"
                )
            
            result = response.json()
            return result.get("data", {})
    except Exception as e:
        logger.error(f"Error querying DID {did}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error querying DID: {str(e)}")

async def list_dids_on_chain(
    controller: Optional[str] = None,
    entity_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10
) -> Dict[str, Any]:
    """List DIDs from the blockchain with pagination"""
    try:
        contract_address = os.environ.get("EDUID_CONTRACT_ADDRESS")
        if not contract_address:
            raise HTTPException(status_code=500, detail="EDUID_CONTRACT_ADDRESS environment variable not set")
        
        query_msg = {
            "list_dids": {
                "pagination": {
                    "limit": limit,
                    "offset": (page - 1) * limit
                }
            }
        }
        
        if controller:
            query_msg["list_dids"]["controller"] = controller
        
        if entity_type:
            query_msg["list_dids"]["entity_type"] = entity_type
        
        if status:
            query_msg["list_dids"]["status"] = status
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{COSMOS_REST_API}/cosmwasm/wasm/v1/contract/{contract_address}/smart/{base64.b64encode(json.dumps(query_msg).encode()).decode()}"
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to list DIDs: {response.text}"
                )
            
            result = response.json()
            return result.get("data", {})
    except Exception as e:
        logger.error(f"Error listing DIDs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing DIDs: {str(e)}")

async def resolve_did(did: str) -> Dict[str, Any]:
    """Resolve a DID by combining on-chain DID document with off-chain entity data"""
    try:
        # Query on-chain DID document
        did_document = await query_did_on_chain(did)
        
        if not did_document:
            raise HTTPException(status_code=404, detail=f"DID {did} not found")
        
        # Fetch off-chain entity data
        try:
            entity_data = await retrieve_entity_data(did)
            
            # Check data integrity
            on_chain_hash = did_document.get("metadata", {}).get("hash")
            off_chain_hash = entity_data.get("metadata", {}).get("hash")
            
            integrity_verified = on_chain_hash and off_chain_hash and on_chain_hash == off_chain_hash
            
            # Combine data
            result = {
                "did_document": did_document,
                "entity_data": entity_data,
                "integrity_verified": integrity_verified
            }
            return result
        except HTTPException as e:
            if e.status_code == 404:
                # If entity data not found, return only the DID document
                return {
                    "did_document": did_document,
                    "entity_data": None,
                    "integrity_verified": False
                }
            raise
    except Exception as e:
        logger.error(f"Error resolving DID {did}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resolving DID: {str(e)}")

async def verify_credential(credential_did: str) -> Dict[str, Any]:
    """Verify a credential by checking its integrity and validity"""
    try:
        # Resolve the credential DID
        credential_data = await resolve_did(credential_did)
        
        if not credential_data["did_document"]:
            raise HTTPException(status_code=404, detail=f"Credential {credential_did} not found")
        
        # Check if credential is revoked
        if credential_data["did_document"].get("metadata", {}).get("status") == "revoked":
            return {
                "verified": False,
                "reason": "Credential has been revoked",
                "credential": credential_data
            }
        
        # Check if credential is expired
        if credential_data["entity_data"]:
            expiration_date = credential_data["entity_data"].get("credential_info", {}).get("expiration_date")
            if expiration_date and datetime.fromisoformat(expiration_date) < datetime.now():
                return {
                    "verified": False,
                    "reason": "Credential has expired",
                    "credential": credential_data
                }
        
        # Check data integrity
        if not credential_data["integrity_verified"]:
            return {
                "verified": False,
                "reason": "Data integrity check failed",
                "credential": credential_data
            }
        
        # Verify issuer and holder DIDs
        if credential_data["entity_data"]:
            issuer_did = credential_data["entity_data"].get("credential_info", {}).get("issuer_did")
            holder_did = credential_data["entity_data"].get("credential_info", {}).get("holder_did")
            
            # Verify issuer exists and is not revoked
            if issuer_did:
                issuer_data = await query_did_on_chain(issuer_did)
                if not issuer_data:
                    return {
                        "verified": False,
                        "reason": f"Issuer DID {issuer_did} not found",
                        "credential": credential_data
                    }
                
                if issuer_data.get("metadata", {}).get("status") == "revoked":
                    return {
                        "verified": False,
                        "reason": f"Issuer DID {issuer_did} has been revoked",
                        "credential": credential_data
                    }
            
            # Verify holder exists
            if holder_did:
                holder_data = await query_did_on_chain(holder_did)
                if not holder_data:
                    return {
                        "verified": False,
                        "reason": f"Holder DID {holder_did} not found",
                        "credential": credential_data
                    }
        
        # If all checks pass, credential is verified
        return {
            "verified": True,
            "credential": credential_data
        }
    except Exception as e:
        logger.error(f"Error verifying credential {credential_did}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error verifying credential: {str(e)}")
