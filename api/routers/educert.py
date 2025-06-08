from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict

router = APIRouter()

# In-memory credential store (hash -> credential)
credentials: Dict[str, dict] = {}

class IssueVCRequest(BaseModel):
    hash: str
    metadata: str
    issuer: str
    signature: str

class RevokeVCRequest(BaseModel):
    hash: str

@router.post("/edu-cert/issue")
def issue_vc(req: IssueVCRequest):
    if req.hash in credentials:
        raise HTTPException(status_code=400, detail="Credential already exists.")
    credentials[req.hash] = {
        "hash": req.hash,
        "metadata": req.metadata,
        "issuer": req.issuer,
        "signature": req.signature,
        "revoked": False
    }
    return {"success": True, "message": "Credential issued.", "credential": credentials[req.hash]}

@router.post("/edu-cert/revoke")
def revoke_vc(req: RevokeVCRequest):
    cred = credentials.get(req.hash)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found.")
    cred["revoked"] = True
    return {"success": True, "message": "Credential revoked.", "credential": cred}

@router.get("/edu-cert/is_revoked")
def is_revoked(hash: str):
    cred = credentials.get(hash)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found.")
    return {"revoked": cred["revoked"]}

@router.get("/edu-cert/get_credential")
def get_credential(hash: str):
    cred = credentials.get(hash)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found.")
    return cred
