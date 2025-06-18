from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Optional
import os
import requests
import json
from fastapi.encoders import jsonable_encoder

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
    """Mint new eVND tokens to a wallet address on the blockchain"""
    try:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        
        # Validate request
        if req.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than zero")
        if not req.address or req.address.strip() == "":
            raise HTTPException(status_code=400, detail="Invalid wallet address")
        
        # Format the exec message for the contract
        exec_msg = {"mint_evnd": {
            "address": req.address,
            "amount": req.amount
        }}
        
        # Execute on blockchain
        result = wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)
        
        # Return success with transaction details
        return {
            "success": True,
            "wallet": req.address,
            "amount": req.amount,
            "tx_result": result
        }
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=404, detail=f"Contract address not set or not deployed: {str(e)}")
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

@router.post("/edupay/transfer")
def transfer_evnd(req: TransferRequest):
    """Transfer eVND tokens between wallet addresses on the blockchain"""
    try:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        
        # Validate request
        if req.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than zero")
        if not req.from_address or req.from_address.strip() == "":
            raise HTTPException(status_code=400, detail="Invalid sender wallet address")
        if not req.to_address or req.to_address.strip() == "":
            raise HTTPException(status_code=400, detail="Invalid recipient wallet address")
        if req.from_address == req.to_address:
            raise HTTPException(status_code=400, detail="Sender and recipient cannot be the same")
        
        # Format the exec message for the contract
        exec_msg = {"transfer_evnd": {
            "from_address": req.from_address,
            "to_address": req.to_address,
            "amount": req.amount
        }}
        
        # Execute on blockchain
        result = wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg, req.from_address)
        
        # Return success with transaction details
        return {
            "success": True,
            "from_address": req.from_address,
            "to_address": req.to_address,
            "amount": req.amount,
            "tx_result": result,
            "tx_id": result.get("tx_id") if isinstance(result, dict) and "tx_id" in result else "tx-" + str(hash(str(req)))[:8]
        }
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=404, detail=f"Contract address not set or not deployed: {str(e)}")
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

@router.post("/edupay/escrow/create")
def create_escrow(req: EscrowCreateRequest):
    try:
        if is_contract_addr_invalid(EDUPAY_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"create_escrow": req.dict()}
        return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=404, detail=f"Contract address not set or not deployed: {str(e)}")
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

@router.post("/edupay/escrow/release")
def release_escrow(req: EscrowReleaseRequest):
    try:
        exec_msg = {"release_escrow": req.dict()}
        return wasm_execute(EDUPAY_CONTRACT_ADDR, exec_msg)
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

@router.get("/edupay/balance")
def get_balance(address: str):
    try:
        query_msg = {"get_balance": {"address": address}}
        result = wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)
        return jsonable_encoder(result)
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

@router.get("/edupay/escrow")
def get_escrow(escrow_id: str):
    try:
        query_msg = {"get_escrow": {"escrow_id": escrow_id}}
        result = wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)
        return jsonable_encoder(result)
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

@router.get("/edupay/price")
def get_price():
    try:
        query_msg = {"get_price": {}}
        result = wasm_query(EDUPAY_CONTRACT_ADDR, query_msg)
        return jsonable_encoder(result)
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

# Đã loại bỏ các endpoint mock, chỉ giữ lại các endpoint thật kết nối đến blockchain
