from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import os
import requests
import json

router = APIRouter()

EDUID_CONTRACT_ADDR = os.getenv("EDUID_CONTRACT_ADDR", "eduid_contract_address")
CORE_REST_URL = os.getenv("CORE_REST_URL", "http://core:26657")

def wasm_query(contract_addr: str, query_msg: dict):
    url = f"{CORE_REST_URL}/wasm/v1/contract/{contract_addr}/smart/{json.dumps(query_msg)}"
    resp = requests.get(url)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Blockchain query failed: {resp.text}")
    return resp.json()["data"] if "data" in resp.json() else resp.json()

def wasm_execute(contract_addr: str, exec_msg: dict, sender: str = "node1"):
    url = f"{CORE_REST_URL}/wasm/v1/contract/{contract_addr}/execute"
    payload = {"sender": sender, "msg": exec_msg}
    resp = requests.post(url, json=payload)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Blockchain execute failed: {resp.text}")
    return resp.json()

class RegisterDIDRequest(BaseModel):
    did: str
    public_key: str
    service_endpoint: Optional[str] = None
    context: Optional[str] = "https://www.w3.org/ns/did/v1"

class UpdateDIDRequest(BaseModel):
    did: str
    public_key: Optional[str] = None
    service_endpoint: Optional[str] = None
    context: Optional[str] = None

@router.post("/edu-id/register")
def register_did(req: RegisterDIDRequest):
    exec_msg = {"register_did": {"did_doc": req.dict()}}
    return wasm_execute(EDUID_CONTRACT_ADDR, exec_msg)

@router.post("/edu-id/update")
def update_did(req: UpdateDIDRequest):
    exec_msg = {"update_did": {"did_doc": req.dict()}}
    return wasm_execute(EDUID_CONTRACT_ADDR, exec_msg)

@router.get("/edu-id/get_did")
def get_did(did: str):
    query_msg = {"get_did": {"did": did}}
    return wasm_query(EDUID_CONTRACT_ADDR, query_msg)

@router.get("/edu-id/get_did_hash")
def get_did_hash(did: str):
    query_msg = {"get_did_hash": {"did": did}}
    return wasm_query(EDUID_CONTRACT_ADDR, query_msg)

@router.get("/edu-id/list")
def list_dids():
    query_msg = {"list_dids": {}}
    return wasm_query(EDUID_CONTRACT_ADDR, query_msg)
