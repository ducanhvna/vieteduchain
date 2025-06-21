#!/usr/bin/env python3
"""
FastAPI implementation of the Custom REST API for Cosmos Permissioned Network
This replaces the Go implementation with a Python-based FastAPI version
"""

from fastapi import FastAPI, HTTPException, Request, Path, Query, Body, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import httpx
import uvicorn
import os
import sys
import subprocess
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from logging.handlers import RotatingFileHandler
import asyncio
import time
import psutil
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST

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
    title="EduChain Custom API",
    description="Custom REST API for Cosmos Permissioned Network",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json"
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

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", "1318"))
    host = os.getenv("API_HOST", "0.0.0.0")
    log_level = os.getenv("LOG_LEVEL", "info")
    
    print(f"Starting FastAPI server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, log_level=log_level, reload=False)
