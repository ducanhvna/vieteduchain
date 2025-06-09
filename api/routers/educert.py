from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict
import os
import requests
import json

router = APIRouter()

EDUCERT_CONTRACT_ADDR = os.getenv("EDUCERT_CONTRACT_ADDR", "educert_contract_address")
CORE_REST_URL = os.getenv("CORE_REST_URL", "http://core:26657")

def is_contract_addr_invalid(addr: str):
    return not addr or addr.endswith('_contract_address') or addr == ''

def wasm_query(contract_addr: str, query_msg: dict):
    if is_contract_addr_invalid(contract_addr):
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    url = f"{CORE_REST_URL}/wasm/v1/contract/{contract_addr}/smart/{json.dumps(query_msg)}"
    resp = requests.get(url)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Blockchain query failed: {resp.text}")
    return resp.json()["data"] if "data" in resp.json() else resp.json()

def wasm_execute(contract_addr: str, exec_msg: dict, sender: str = "node1"):
    if is_contract_addr_invalid(contract_addr):
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    if not contract_addr or contract_addr == "" or contract_addr.endswith("_contract_address"):
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    url = f"{CORE_REST_URL}/wasm/v1/contract/{contract_addr}/execute"
    payload = {
        "sender": sender,
        "msg": exec_msg
    }
    resp = requests.post(url, json=payload)
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Blockchain execute failed: {resp.text}")
    return resp.json()

class IssueVCRequest(BaseModel):
    hash: str
    metadata: str
    issuer: str
    signature: str

class RevokeVCRequest(BaseModel):
    hash: str

@router.post("/edu-cert/issue")
def issue_vc(req: IssueVCRequest, request: Request):
    try:
        if is_contract_addr_invalid(EDUCERT_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"issue_vc": {
            "hash": req.hash,
            "metadata": req.metadata,
            "issuer": req.issuer,
            "signature": req.signature
        }}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    except Exception as e:
        if is_contract_addr_invalid(EDUCERT_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edu-cert/revoke")
def revoke_vc(req: RevokeVCRequest, request: Request):
    exec_msg = {"revoke_vc": {"hash": req.hash}}
    sender = request.headers.get("X-Node-Id", "node1")
    return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)

@router.get("/edu-cert/is_revoked")
def is_revoked(hash: str):
    query_msg = {"is_revoked": {"hash": hash}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

@router.get("/edu-cert/get_credential")
def get_credential(hash: str):
    query_msg = {"get_credential": {"hash": hash}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)
