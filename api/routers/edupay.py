from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import os
import requests
import json

router = APIRouter()

EDUPAY_CONTRACT_ADDR = os.getenv("EDUPAY_CONTRACT_ADDR", "edupay_contract_address")
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
    payload = {"sender": sender, "msg": exec_msg}
    resp = requests.post(url, json=payload)
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Blockchain execute failed: {resp.text}")
    return resp.json()

class MintRequest(BaseModel):
    address: str
    amount: float

class TransferRequest(BaseModel):
    from_address: str
    to_address: str
    amount: float

class EscrowCreateRequest(BaseModel):
    escrow_id: str
    payer: str
    school: str
    amount: float

class EscrowReleaseRequest(BaseModel):
    escrow_id: str
    proof_of_enrollment: bool

class PriceQueryResponse(BaseModel):
    vnd_usdc: float

@router.post("/edupay/mint")
def mint_evnd(req: MintRequest):
    try:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"mint_evnd": req.dict()}
        return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    except Exception as e:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edupay/transfer")
def transfer_evnd(req: TransferRequest):
    try:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"transfer_evnd": req.dict()}
        return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    except Exception as e:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edupay/escrow/create")
def create_escrow(req: EscrowCreateRequest):
    try:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"create_escrow": req.dict()}
        return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    except Exception as e:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edupay/escrow/release")
def release_escrow(req: EscrowReleaseRequest):
    try:
        exec_msg = {"release_escrow": req.dict()}
        return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)
    except Exception as e:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            return {"detail": "Contract address not set or not deployed"}, 404
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/edupay/balance")
def get_balance(address: str):
    try:
        query_msg = {"get_balance": {"address": address}}
        return wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)
    except Exception as e:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            return {"detail": "Contract address not set or not deployed"}, 404
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/edupay/escrow")
def get_escrow(escrow_id: str):
    try:
        query_msg = {"get_escrow": {"escrow_id": escrow_id}}
        return wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)
    except Exception as e:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            return {"detail": "Contract address not set or not deployed"}, 404
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/edupay/price")
def get_price():
    try:
        query_msg = {"get_price": {}}
        return wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)
    except Exception as e:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            return {"detail": "Contract address not set or not deployed"}, 404
        raise HTTPException(status_code=500, detail=str(e))
