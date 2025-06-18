from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict
import time
import os
import requests
import json

router = APIRouter()

RESEARCHLEDGER_CONTRACT_ADDR = os.getenv("RESEARCHLEDGER_CONTRACT_ADDR", "researchledger_contract_address")
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
    url = f"{CORE_REST_URL}/wasm/v1/contract/{contract_addr}/execute"
    payload = {"sender": sender, "msg": exec_msg}
    resp = requests.post(url, json=payload)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Blockchain execute failed: {resp.text}")
    return resp.json()

class RegisterHashRequest(BaseModel):
    hash: str
    cid: Optional[str] = None
    doi: Optional[str] = None
    authors: Optional[List[str]] = None
    owner: str

class MintDOINFTRequest(BaseModel):
    hash: str
    doi: str
    owner: str

class SubmitPlagiarismRequest(BaseModel):
    original_hash: str
    plagiarized_hash: str
    claimer: str

class RewardBountyRequest(BaseModel):
    claim_id: str

@router.post("/research/register_hash")
def register_hash(req: RegisterHashRequest):
    try:
        if is_contract_addr_invalid(RESEARCHLEDGER_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"register_hash": req.dict()}
        return wasm_execute(RESEARCHLEDGER_CONTRACT_ADDR, exec_msg)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)

@router.post("/research/mint_doi_nft")
def mint_doi_nft(req: MintDOINFTRequest):
    exec_msg = {"mint_doi_nft": req.dict()}
    return wasm_execute(RESEARCHLEDGER_CONTRACT_ADDR, exec_msg)

@router.post("/research/submit_plagiarism")
def submit_plagiarism(req: SubmitPlagiarismRequest):
    exec_msg = {"submit_plagiarism": req.dict()}
    return wasm_execute(RESEARCHLEDGER_CONTRACT_ADDR, exec_msg)

@router.post("/research/reward_bounty")
def reward_bounty(req: RewardBountyRequest):
    exec_msg = {"reward_bounty": req.dict()}
    return wasm_execute(RESEARCHLEDGER_CONTRACT_ADDR, exec_msg)

@router.get("/research/get_hash_record")
def get_hash_record(hash: str):
    query_msg = {"get_hash_record": {"hash": hash}}
    return wasm_query(RESEARCHLEDGER_CONTRACT_ADDR, query_msg)

@router.get("/research/get_bounty_claim")
def get_bounty_claim(claim_id: str):
    query_msg = {"get_bounty_claim": {"claim_id": claim_id}}
    return wasm_query(RESEARCHLEDGER_CONTRACT_ADDR, query_msg)

@router.get("/research/list_hashes")
def list_hashes():
    query_msg = {"list_hashes": {}}
    return wasm_query(RESEARCHLEDGER_CONTRACT_ADDR, query_msg)

@router.get("/research/list_bounty_claims")
def list_bounty_claims():
    query_msg = {"list_bounty_claims": {}}
    return wasm_query(RESEARCHLEDGER_CONTRACT_ADDR, query_msg)

@router.get("/research/search_hashes")
def search_hashes(owner: str = None, doi: str = None):
    query_msg = {"search_hashes": {"owner": owner, "doi": doi}}
    return wasm_query(RESEARCHLEDGER_CONTRACT_ADDR, query_msg)

@router.post("/researchledger/publish")
async def publish_research(request: Request):
    """Publish research on the blockchain"""
    try:
        try:
            data = await request.json() if hasattr(request, 'json') else {}
        except Exception:
            data = {}
        
        # Required parameters
        title = data.get("title")
        abstract = data.get("abstract", "")
        authors = data.get("authors", [])
        doi = data.get("doi", "")
        hash_value = data.get("hash")  # Hash of the research paper content
        owner = request.headers.get("X-Node-Id", "node1")
        
        if not title or not hash_value:
            raise HTTPException(status_code=400, detail="Missing title or hash parameter")
            
        # Generate research ID if not provided
        import hashlib
        import time
        research_id = hashlib.sha256(f"{title}-{hash_value}-{time.time()}".encode()).hexdigest()
        
        # Create metadata
        metadata = {
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "doi": doi,
            "publication_date": time.strftime("%Y-%m-%d")
        }
        
        # Publish research on blockchain
        exec_msg = {
            "submit_hash": {
                "hash": hash_value,
                "owner": owner,
                "metadata": json.dumps(metadata),
                "doi": doi
            }
        }
        
        result = wasm_execute(RESEARCHLEDGER_CONTRACT_ADDR, exec_msg, owner)
        
        return {
            "success": True, 
            "research_id": research_id,
            "hash": hash_value,
            "doi": doi,
            "owner": owner,
            "tx_result": result
        }
    except Exception as e:
        msg = str(e) or "Unknown error"
        raise HTTPException(status_code=500, detail=msg)
