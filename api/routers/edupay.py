from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional

router = APIRouter()

# In-memory store for eVND balances and escrows
balances: Dict[str, float] = {}  # address -> eVND balance
escrows: Dict[str, dict] = {}    # escrow_id -> escrow info

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
    # Only for demo: anyone can mint
    balances[req.address] = balances.get(req.address, 0) + req.amount
    return {"success": True, "address": req.address, "balance": balances[req.address]}

@router.post("/edupay/transfer")
def transfer_evnd(req: TransferRequest):
    if balances.get(req.from_address, 0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance.")
    balances[req.from_address] -= req.amount
    balances[req.to_address] = balances.get(req.to_address, 0) + req.amount
    return {"success": True, "from": req.from_address, "to": req.to_address, "amount": req.amount}

@router.post("/edupay/escrow/create")
def create_escrow(req: EscrowCreateRequest):
    if balances.get(req.payer, 0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance.")
    if req.escrow_id in escrows:
        raise HTTPException(status_code=400, detail="Escrow already exists.")
    balances[req.payer] -= req.amount
    escrows[req.escrow_id] = {
        "payer": req.payer,
        "school": req.school,
        "amount": req.amount,
        "released": False
    }
    return {"success": True, "escrow_id": req.escrow_id, "escrow": escrows[req.escrow_id]}

@router.post("/edupay/escrow/release")
def release_escrow(req: EscrowReleaseRequest):
    escrow = escrows.get(req.escrow_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found.")
    if escrow["released"]:
        raise HTTPException(status_code=400, detail="Escrow already released.")
    if not req.proof_of_enrollment:
        raise HTTPException(status_code=400, detail="Proof of enrollment required.")
    balances[escrow["school"]] = balances.get(escrow["school"], 0) + escrow["amount"]
    escrow["released"] = True
    return {"success": True, "escrow_id": req.escrow_id, "escrow": escrow}

@router.get("/edupay/balance")
def get_balance(address: str):
    return {"address": address, "balance": balances.get(address, 0)}

@router.get("/edupay/escrow")
def get_escrow(escrow_id: str):
    escrow = escrows.get(escrow_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found.")
    return escrow

@router.get("/edupay/price")
def get_price():
    # Simulate Band oracle: 1 USDC = 25,000 VND (demo, randomize slightly)
    import random
    price = 25000 * (1 + random.uniform(-0.0025, 0.0025))
    return {"vnd_usdc": round(price, 2)}
