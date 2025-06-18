from fastapi import APIRouter, HTTPException, Body, Request
from pydantic import BaseModel, validator
from typing import Optional, List, Dict
import os
import requests
import json
from fastapi.encoders import jsonable_encoder

router = APIRouter()

# In-memory stores
# seats: Dict[str, dict] = {}  # seat_id -> seat info
# scores: Dict[str, dict] = {}  # candidate_hash -> score
# results: Dict[str, dict] = {}  # candidate_hash -> result

class MintSeatRequest(BaseModel):
    seat_id: str

class BurnSeatRequest(BaseModel):
    seat_id: str

class PushScoreRequest(BaseModel):
    candidate_hash: str
    score: int

class RunMatchingRequest(BaseModel):
    pass

# class AddSeatRequest(BaseModel):
#     seat_id: str
#     student_id: str
#     school: str
#     major: str
#     year: int

# class AddScoreRequest(BaseModel):
#     score_id: str
#     student_id: str
#     subject: str
#     score: float
#     year: int

#     @validator('score')
#     def score_must_be_valid(cls, v):
#         if not (0 <= v <= 10):
#             raise ValueError('score must be between 0 and 10')
#         return v

# class AddResultRequest(BaseModel):
#     result_id: str
#     student_id: str
#     school: str
#     status: str
#     year: int

#     @validator('status')
#     def status_must_be_valid(cls, v):
#         if v not in ["Đỗ", "Trượt"]:
#             raise ValueError('status must be "Đỗ" hoặc "Trượt"')
#         return v

# Địa chỉ contract eduadmission (cần set đúng theo deploy thực tế)
EDUADMISSION_CONTRACT_ADDR = os.getenv("EDUADMISSION_CONTRACT_ADDR", "eduadmission_contract_address")
CORE_REST_URL = os.getenv("CORE_REST_URL", "http://core:26657")

# Helper: gọi smart contract query CosmWasm

def is_contract_addr_invalid(addr: str):
    return not addr or addr.endswith('_contract_address') or addr == ''

def wasm_query(contract_addr: str, query_msg: dict):
    if is_contract_addr_invalid(contract_addr):
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    url = f"{CORE_REST_URL}/wasm/v1/contract/{contract_addr}/smart/{json.dumps(query_msg)}"
    resp = requests.get(url)
    if resp.status_code == 404:
        # Nếu contract chưa deploy hoặc sai address, trả về list rỗng thay vì lỗi 500
        return []
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Blockchain query failed: {resp.text}")
    return resp.json()["data"] if "data" in resp.json() else resp.json()

# Helper: gửi transaction execute CosmWasm contract (giả lập, cần tích hợp thực tế với core)
def wasm_execute(contract_addr: str, exec_msg: dict, sender: str = "node1"):  # sender là node id hoặc ví
    if is_contract_addr_invalid(contract_addr):
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    url = f"{CORE_REST_URL}/wasm/v1/contract/{contract_addr}/execute"
    payload = {
        "sender": sender,
        "msg": exec_msg
    }
    print(f"Sending execute request to {url} with payload: {json.dumps(payload)}")
    try:
        resp = requests.post(url, json=payload)
        print(f"Response status: {resp.status_code}")
        print(f"Response body: {resp.text}")
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Blockchain execute failed: {resp.text}")
        return resp.json()
    except Exception as e:
        print(f"Exception during contract execution: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Blockchain execute failed: {str(e)}")

@router.post("/eduadmission/mint_seat")
async def mint_seat(req: MintSeatRequest, request: Request):
    try:
        print(f"Processing mint_seat request for seat_id: {req.seat_id}")
        if is_contract_addr_invalid(EDUADMISSION_CONTRACT_ADDR):
            print(f"Invalid contract address: {EDUADMISSION_CONTRACT_ADDR}")
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"mint_seat_nft": {"seat_id": req.seat_id}}
        sender = request.headers.get("X-Node-Id", "node1")
        print(f"Using sender: {sender}")
        return wasm_execute(EDUADMISSION_CONTRACT_ADDR, exec_msg, sender)
    except requests.exceptions.RequestException as e:
        print(f"RequestException: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Contract address not set or not deployed: {str(e)}")
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

@router.post("/eduadmission/burn_seat")
async def burn_seat(req: BurnSeatRequest, request: Request):
    exec_msg = {"burn_seat_nft": {"seat_id": req.seat_id}}
    sender = request.headers.get("X-Node-Id", "node1")
    return wasm_execute(EDUADMISSION_CONTRACT_ADDR, exec_msg, sender)

@router.post("/eduadmission/push_score")
async def push_score(req: PushScoreRequest, request: Request):
    exec_msg = {"push_score": {"candidate_hash": req.candidate_hash, "score": req.score}}
    sender = request.headers.get("X-Node-Id", "node1")
    return wasm_execute(EDUADMISSION_CONTRACT_ADDR, exec_msg, sender)

@router.post("/eduadmission/run_matching")
async def run_matching(request: Request):
    exec_msg = {"run_matching": {}}
    sender = request.headers.get("X-Node-Id", "node1")
    return wasm_execute(EDUADMISSION_CONTRACT_ADDR, exec_msg, sender)

@router.get("/eduadmission/get_seat")
def get_seat(seat_id: str):
    query_msg = {"get_seat_nft": {"seat_id": seat_id}}
    result = wasm_query(EDUADMISSION_CONTRACT_ADDR, query_msg)
    return jsonable_encoder(result)

@router.get("/eduadmission/get_score")
def get_score(candidate_hash: str):
    query_msg = {"get_candidate_score": {"candidate_hash": candidate_hash}}
    result = wasm_query(EDUADMISSION_CONTRACT_ADDR, query_msg)
    return jsonable_encoder(result)

@router.get("/eduadmission/get_result")
def get_result(candidate_hash: str):
    query_msg = {"get_admission_result": {"candidate_hash": candidate_hash}}
    result = wasm_query(EDUADMISSION_CONTRACT_ADDR, query_msg)
    return jsonable_encoder(result)

@router.get("/eduadmission/list_scores")
def list_scores():
    query_msg = {"list_scores": {}}
    result = wasm_query(EDUADMISSION_CONTRACT_ADDR, query_msg)
    return jsonable_encoder(result)

@router.get("/eduadmission/list_seats")
def list_seats():
    query_msg = {"list_seats": {}}
    result = wasm_query(EDUADMISSION_CONTRACT_ADDR, query_msg)
    return jsonable_encoder(result)

@router.get("/eduadmission/list_results")
def list_results():
    query_msg = {"list_admission_results": {}}
    result = wasm_query(EDUADMISSION_CONTRACT_ADDR, query_msg)
    return jsonable_encoder(result)

@router.post("/eduadmission/assign_seat")
async def assign_seat(request: Request):
    """
    Assign a seat to a candidate (gọi vào core).
    Yêu cầu JSON: { "seat_id": "...", "candidate_hash": "..." }
    """
    try:
        data = await request.json()
        seat_id = data.get("seat_id")
        candidate_hash = data.get("candidate_hash")
        if not seat_id or not candidate_hash:
            raise HTTPException(status_code=400, detail="Missing seat_id or candidate_hash")
        exec_msg = {"assign_seat": {"seat_id": seat_id, "candidate_hash": candidate_hash}}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUADMISSION_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)
