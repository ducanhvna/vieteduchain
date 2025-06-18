from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Optional, List
import os
import requests
import json
import qrcode
from io import BytesIO
import base64

router = APIRouter()

EDUCERT_CONTRACT_ADDR = os.getenv("EDUCERT_CONTRACT_ADDR", "educert_contract_address")
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
    payload = {
        "sender": sender,
        "msg": exec_msg
    }
    resp = requests.post(url, json=payload)
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Blockchain execute failed: {resp.text}")
    return resp.json()

class IssueVCRequest(BaseModel):
    hash: str
    metadata: str
    issuer: str
    signature: str

class RevokeVCRequest(BaseModel):
    hash: str

# NFT related models
class MintNFTRequest(BaseModel):
    token_id: str
    credential_hash: str
    recipient: str
    metadata_uri: str

class TransferNFTRequest(BaseModel):
    token_id: str
    recipient: str

class BurnNFTRequest(BaseModel):
    token_id: str

# School node related models
class RegisterSchoolNodeRequest(BaseModel):
    did: str
    name: str
    service_endpoint: str
    node_id: str

class UpdateSchoolNodeRequest(BaseModel):
    did: str
    name: Optional[str] = None
    service_endpoint: Optional[str] = None
    active: Optional[bool] = None

class DeactivateSchoolNodeRequest(BaseModel):
    did: str

# QR code related models
class QRCodeRequest(BaseModel):
    data_type: str  # "nft" or "did"
    id: str

class QRCodeResponse(BaseModel):
    data_type: str
    id: str
    verify_url: str
    qr_image: str  # Base64 encoded image

@router.post("/edu-cert/issue")
async def issue_vc(req: IssueVCRequest, request: Request):
    try:
        if is_contract_addr_invalid(EDUCERT_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"issue_vc": {
            "hash": req.hash,
            "metadata": req.metadata,
            "issuer": req.issuer,
            "signature": req.signature
        }}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    except Exception as e:
        if is_contract_addr_invalid(EDUCERT_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edu-cert/revoke")
async def revoke_vc(req: RevokeVCRequest, request: Request):
    exec_msg = {"revoke_vc": {"hash": req.hash}}
    sender = request.headers.get("X-Node-Id", "node1")
    return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)

@router.get("/edu-cert/is_revoked")
def is_revoked(hash: str):
    query_msg = {"is_revoked": {"hash": hash}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

@router.get("/edu-cert/get_credential")
def get_credential(hash: str):
    query_msg = {"get_credential": {"hash": hash}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

# NFT related endpoints
@router.post("/edu-cert/nft/mint")
async def mint_credential_nft(req: MintNFTRequest, request: Request):
    """Mint a new NFT for a credential"""
    try:
        exec_msg = {"mint_credential_nft": {
            "token_id": req.token_id,
            "credential_hash": req.credential_hash,
            "recipient": req.recipient,
            "metadata_uri": req.metadata_uri
        }}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edu-cert/nft/transfer")
async def transfer_credential_nft(req: TransferNFTRequest, request: Request):
    """Transfer an NFT to a new owner"""
    try:
        exec_msg = {"transfer_credential_nft": {
            "token_id": req.token_id,
            "recipient": req.recipient
        }}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edu-cert/nft/burn")
async def burn_credential_nft(req: BurnNFTRequest, request: Request):
    """Burn (destroy) an NFT"""
    try:
        exec_msg = {"burn_credential_nft": {
            "token_id": req.token_id
        }}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/edu-cert/nft/{token_id}")
def get_credential_nft(token_id: str):
    """Get details about a specific NFT"""
    query_msg = {"get_credential_nft": {"token_id": token_id}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

@router.get("/edu-cert/nft/owner/{owner}")
def get_nfts_by_owner(owner: str):
    """Get all NFTs owned by a specific address"""
    query_msg = {"get_nfts_by_owner": {"owner": owner}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

@router.get("/edu-cert/nft/issuer/{issuer}")
def get_nfts_by_issuer(issuer: str):
    """Get all NFTs issued by a specific address"""
    query_msg = {"get_nfts_by_issuer": {"issuer": issuer}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

# School node related endpoints
@router.post("/edu-cert/school/register")
async def register_school_node(req: RegisterSchoolNodeRequest, request: Request):
    """Register a new school as a node in the network"""
    try:
        exec_msg = {"register_school_node": {
            "did": req.did,
            "name": req.name,
            "service_endpoint": req.service_endpoint,
            "node_id": req.node_id
        }}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edu-cert/school/update")
async def update_school_node(req: UpdateSchoolNodeRequest, request: Request):
    """Update an existing school node"""
    try:
        exec_msg = {"update_school_node": {
            "did": req.did,
            "name": req.name,
            "service_endpoint": req.service_endpoint,
            "active": req.active
        }}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edu-cert/school/deactivate")
async def deactivate_school_node(req: DeactivateSchoolNodeRequest, request: Request):
    """Deactivate a school node"""
    try:
        exec_msg = {"deactivate_school_node": {
            "did": req.did
        }}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/edu-cert/school/{did}")
def get_school_node(did: str):
    """Get details about a specific school node"""
    query_msg = {"get_school_node": {"did": did}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

@router.get("/edu-cert/school/list")
def list_school_nodes(active_only: Optional[bool] = None):
    """List all school nodes, optionally filtering for active nodes only"""
    query_msg = {"list_school_nodes": {"active_only": active_only}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

# Transaction history
@router.get("/edu-cert/transactions")
def get_transaction_history(limit: Optional[int] = None):
    """Get transaction history from the ledger"""
    query_msg = {"get_transaction_history": {"limit": limit}}
    return wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)

# QR code generation
@router.post("/edu-cert/qrcode")
def generate_qr_code(req: QRCodeRequest):
    """Generate a QR code for a DID or NFT"""
    try:
        # Get the QR code data from the contract
        query_msg = {"generate_qr_code_data": {"data_type": req.data_type, "id": req.id}}
        qr_data = wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)
        
        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECTION_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data["verify_url"])
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert PIL image to base64 string
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Return the QR code data and image
        return QRCodeResponse(
            data_type=qr_data["data_type"],
            id=qr_data["id"],
            verify_url=qr_data["verify_url"],
            qr_image=img_str
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/educert/create_certificate")
async def create_certificate(request: Request):
    """Create a new certificate on the blockchain"""
    try:
        try:
            data = await request.json() if hasattr(request, 'json') else {}
        except Exception:
            data = {}
        
        # Required parameters
        student_id = data.get("student_id")
        certificate_type = data.get("certificate_type", "general")
        metadata = data.get("metadata", {})
        issuer = request.headers.get("X-Node-Id", "node1")
        
        if not student_id:
            raise HTTPException(status_code=400, detail="Missing student_id parameter")
            
        # Generate a unique certificate hash
        import hashlib
        import time
        cert_hash = hashlib.sha256(f"{student_id}-{certificate_type}-{time.time()}".encode()).hexdigest()
        
        # Create certificate on blockchain
        exec_msg = {
            "issue_credential": {
                "hash": cert_hash,
                "metadata": json.dumps(metadata),
                "issuer": issuer,
                "credential_type": certificate_type
            }
        }
        
        result = wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, issuer)
        
        return {
            "success": True, 
            "certificate_id": cert_hash,
            "student_id": student_id,
            "issuer": issuer,
            "type": certificate_type,
            "tx_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/educert/create_course_completion")
async def create_course_completion(request: Request):
    """Create a course completion certificate on the blockchain"""
    try:
        try:
            data = await request.json() if hasattr(request, 'json') else {}
        except Exception:
            data = {}
        
        # Required parameters
        student_id = data.get("student_id")
        course_id = data.get("course_id")
        course_name = data.get("course_name", "")
        grade = data.get("grade", "")
        completion_date = data.get("completion_date", "")
        issuer = request.headers.get("X-Node-Id", "node1")
        
        if not student_id or not course_id:
            raise HTTPException(status_code=400, detail="Missing student_id or course_id parameter")
            
        # Generate a unique certificate hash
        import hashlib
        import time
        cert_hash = hashlib.sha256(f"{student_id}-{course_id}-{time.time()}".encode()).hexdigest()
        
        # Create metadata
        metadata = {
            "student_id": student_id,
            "course_id": course_id,
            "course_name": course_name,
            "grade": grade,
            "completion_date": completion_date,
            "certificate_type": "course_completion"
        }
        
        # Create certificate on blockchain
        exec_msg = {
            "issue_credential": {
                "hash": cert_hash,
                "metadata": json.dumps(metadata),
                "issuer": issuer,
                "credential_type": "course_completion"
            }
        }
        
        result = wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, issuer)
        
        return {
            "success": True, 
            "course_completion_id": cert_hash,
            "student_id": student_id,
            "course_id": course_id,
            "issuer": issuer,
            "tx_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/educert/issue_degree")
async def issue_degree(request: Request):
    """Issue a degree certificate on the blockchain"""
    try:
        try:
            data = await request.json() if hasattr(request, 'json') else {}
        except Exception:
            data = {}
        
        # Required parameters
        student_id = data.get("student_id")
        degree_type = data.get("degree_type", "bachelor")  # bachelor, master, phd
        major = data.get("major", "")
        university = data.get("university", "")
        issue_date = data.get("issue_date", "")
        graduation_date = data.get("graduation_date", "")
        issuer = request.headers.get("X-Node-Id", "node1")
        
        if not student_id:
            raise HTTPException(status_code=400, detail="Missing student_id parameter")
            
        # Generate a unique degree hash
        import hashlib
        import time
        degree_hash = hashlib.sha256(f"{student_id}-{degree_type}-{major}-{time.time()}".encode()).hexdigest()
        
        # Create metadata
        metadata = {
            "student_id": student_id,
            "degree_type": degree_type,
            "major": major,
            "university": university,
            "issue_date": issue_date,
            "graduation_date": graduation_date,
            "certificate_type": "degree"
        }
        
        # Create degree on blockchain
        exec_msg = {
            "issue_credential": {
                "hash": degree_hash,
                "metadata": json.dumps(metadata),
                "issuer": issuer,
                "credential_type": "degree"
            }
        }
        
        result = wasm_execute(EDUCERT_CONTRACT_ADDR, exec_msg, issuer)
        
        return {
            "success": True, 
            "degree_id": degree_hash,
            "student_id": student_id,
            "degree_type": degree_type,
            "major": major,
            "issuer": issuer,
            "tx_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/educert/list_certificates")
def list_certificates(request: Request):
    """List all certificates in the system"""
    try:
        # Set up query parameters
        issuer = request.query_params.get("issuer", None)
        credential_type = request.query_params.get("type", None)
        limit = request.query_params.get("limit", None)
        
        # Convert limit to integer if present
        if limit:
            try:
                limit = int(limit)
            except ValueError:
                limit = None
        
        # Prepare query message
        query_msg = {
            "list_credentials": {
                "issuer": issuer,
                "credential_type": credential_type,
                "limit": limit
            }
        }
        
        # Execute the query
        result = wasm_query(EDUCERT_CONTRACT_ADDR, query_msg)
        
        # Return the results
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
