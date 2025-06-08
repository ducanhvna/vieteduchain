from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import os
import requests
import json

router = APIRouter()

EDUPAY_CONTRACT_ADDR = os.getenv("EDUPAY_CONTRACT_ADDR", "edupay_contract_address")
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
    exec_msg = {"mint_evnd": req.dict()}
    return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)

@router.post("/edupay/transfer")
def transfer_evnd(req: TransferRequest):
    exec_msg = {"transfer_evnd": req.dict()}
    return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)

@router.post("/edupay/escrow/create")
def create_escrow(req: EscrowCreateRequest):
    exec_msg = {"create_escrow": req.dict()}
    return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)

@router.post("/edupay/escrow/release")
def release_escrow(req: EscrowReleaseRequest):
    exec_msg = {"release_escrow": req.dict()}
    return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)

@router.get("/edupay/balance")
def get_balance(address: str):
    query_msg = {"get_balance": {"address": address}}
    return wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)

@router.get("/edupay/escrow")
def get_escrow(escrow_id: str):
    query_msg = {"get_escrow": {"escrow_id": escrow_id}}
    return wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)

@router.get("/edupay/price")
def get_price():
    query_msg = {"get_price": {}}
    return wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)
