from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import time

router = APIRouter()

# In-memory stores
hash_records: Dict[str, dict] = {}
bounty_claims: Dict[str, dict] = {}

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
    if req.hash in hash_records:
        raise HTTPException(status_code=400, detail="Hash already registered.")
    record = {
        "hash": req.hash,
        "owner": req.owner,
        "timestamp": int(time.time()),
        "cid": req.cid,
        "doi": req.doi,
        "authors": req.authors,
        "nft_id": None
    }
    hash_records[req.hash] = record
    return {"success": True, "record": record}

@router.post("/research/mint_doi_nft")
def mint_doi_nft(req: MintDOINFTRequest):
    record = hash_records.get(req.hash)
    if not record:
        raise HTTPException(status_code=404, detail="Hash not found.")
    if record["owner"] != req.owner:
        raise HTTPException(status_code=403, detail="Only owner can mint NFT.")
    nft_id = f"nft:{req.doi}:{req.hash}"
    record["nft_id"] = nft_id
    record["doi"] = req.doi
    return {"success": True, "nft_id": nft_id, "record": record}

@router.post("/research/submit_plagiarism")
def submit_plagiarism(req: SubmitPlagiarismRequest):
    claim_id = f"{req.original_hash}:{req.plagiarized_hash}:{int(time.time())}"
    if claim_id in bounty_claims:
        raise HTTPException(status_code=400, detail="Claim already exists.")
    claim = {
        "original_hash": req.original_hash,
        "plagiarized_hash": req.plagiarized_hash,
        "claimer": req.claimer,
        "rewarded": False
    }
    bounty_claims[claim_id] = claim
    return {"success": True, "claim_id": claim_id, "claim": claim}

@router.post("/research/reward_bounty")
def reward_bounty(req: RewardBountyRequest):
    claim = bounty_claims.get(req.claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    if claim["rewarded"]:
        raise HTTPException(status_code=400, detail="Already rewarded.")
    claim["rewarded"] = True
    # Simulate sending RESEARCH token (not implemented)
    return {"success": True, "claim_id": req.claim_id, "claim": claim}

@router.get("/research/get_hash_record")
def get_hash_record(hash: str):
    record = hash_records.get(hash)
    if not record:
        raise HTTPException(status_code=404, detail="Hash not found.")
    return record

@router.get("/research/get_bounty_claim")
def get_bounty_claim(claim_id: str):
    claim = bounty_claims.get(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    return claim

@router.get("/research/list_hashes")
def list_hashes():
    return list(hash_records.values())

@router.get("/research/list_bounty_claims")
def list_bounty_claims():
    return [{"claim_id": k, **v} for k, v in bounty_claims.items()]

@router.get("/research/search_hashes")
def search_hashes(owner: str = None, doi: str = None):
    results = list(hash_records.values())
    if owner:
        results = [r for r in results if r.get("owner") == owner]
    if doi:
        results = [r for r in results if r.get("doi") == doi]
    return results
