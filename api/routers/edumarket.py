from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
import os
import requests
import json

router = APIRouter()

EDUMARKET_CONTRACT_ADDR = os.getenv("EDUMARKET_CONTRACT_ADDR", "edumarket_contract_address")
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

class CourseNFT(BaseModel):
    id: str
    creator: str
    owner: str
    metadata: str
    price: Decimal
    sold: bool

class MintCourseNFTRequest(BaseModel):
    id: str
    metadata: str
    price: Decimal
    creator: str

class BuyCourseNFTRequest(BaseModel):
    id: str
    buyer: str
    amount: Decimal

@router.post("/edumarket/mint")
def mint_course_nft(req: MintCourseNFTRequest):
    exec_msg = {"mint_course_nft": req.dict()}
    return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg)

@router.post("/edumarket/buy")
def buy_course_nft(req: BuyCourseNFTRequest):
    exec_msg = {"buy_course_nft": req.dict()}
    return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg)

@router.get("/edumarket/{id}")
def get_course_nft(id: str):
    query_msg = {"get_course_nft": {"id": id}}
    return wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)

@router.get("/edumarket")
def list_course_nfts(sold: Optional[bool] = None):
    query_msg = {"list_course_nfts": {}}
    nfts = wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)
    if sold is not None:
        nfts = [n for n in nfts if n.get("sold") == sold]
    return nfts
