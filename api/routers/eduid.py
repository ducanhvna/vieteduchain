from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional

router = APIRouter()

# In-memory DID registry (did -> did_doc)
did_registry: Dict[str, dict] = {}

def hash_did_doc(did_doc: dict) -> str:
    import json, hashlib
    doc_bytes = json.dumps(did_doc, sort_keys=True).encode()
    return hashlib.sha256(doc_bytes).hexdigest()

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
    if req.did in did_registry:
        raise HTTPException(status_code=400, detail="DID already registered.")
    did_doc = {
        "@context": req.context,
        "id": req.did,
        "public_key": req.public_key,
        "service_endpoint": req.service_endpoint,
    }
    did_registry[req.did] = did_doc
    did_hash = hash_did_doc(did_doc)
    return {"success": True, "did": req.did, "did_doc": did_doc, "hash": did_hash}

@router.post("/edu-id/update")
def update_did(req: UpdateDIDRequest):
    did_doc = did_registry.get(req.did)
    if not did_doc:
        raise HTTPException(status_code=404, detail="DID not found.")
    if req.public_key:
        did_doc["public_key"] = req.public_key
    if req.service_endpoint:
        did_doc["service_endpoint"] = req.service_endpoint
    if req.context:
        did_doc["@context"] = req.context
    did_registry[req.did] = did_doc
    did_hash = hash_did_doc(did_doc)
    return {"success": True, "did": req.did, "did_doc": did_doc, "hash": did_hash}

@router.get("/edu-id/get_did")
def get_did(did: str):
    did_doc = did_registry.get(did)
    if not did_doc:
        raise HTTPException(status_code=404, detail="DID not found.")
    return did_doc

@router.get("/edu-id/get_did_hash")
def get_did_hash(did: str):
    did_doc = did_registry.get(did)
    if not did_doc:
        raise HTTPException(status_code=404, detail="DID not found.")
    did_hash = hash_did_doc(did_doc)
    return {"did": did, "hash": did_hash}

@router.get("/edu-id/list")
def list_dids():
    """Trả về danh sách tất cả DID đã đăng ký và DID document."""
    return [{"did": did, "did_doc": doc} for did, doc in did_registry.items()]
