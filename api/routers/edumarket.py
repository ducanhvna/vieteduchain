from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional, Dict
from decimal import Decimal
import os
import requests
import json
import qrcode
from io import BytesIO
import base64

router = APIRouter()

EDUMARKET_CONTRACT_ADDR = os.getenv("EDUMARKET_CONTRACT_ADDR", "edumarket_contract_address")
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

class CourseNFT(BaseModel):
    id: str
    creator: str
    owner: str
    metadata: str
    price: Decimal
    sold: bool
    completed_by: Optional[List[str]] = []

class MintCourseNFTRequest(BaseModel):
    id: str
    metadata: str
    price: Decimal
    creator: str

class BuyCourseNFTRequest(BaseModel):
    id: str
    buyer: str
    amount: Decimal

# Certificate related models
class CourseCompletionCertificate(BaseModel):
    certificate_id: str
    course_id: str
    student: str
    issuer: str
    issue_date: int
    metadata_uri: str
    revoked: bool

class DegreeNFT(BaseModel):
    degree_id: str
    student: str
    issuer: str
    certificate_ids: List[str]
    degree_type: str
    issue_date: int
    metadata_uri: str
    revoked: bool

class CourseProgression(BaseModel):
    student: str
    course_id: str
    progress: int
    completed: bool
    completion_date: Optional[int] = None
    certificate_id: Optional[str] = None

class DegreeRequirements(BaseModel):
    degree_type: str
    required_courses: List[str]
    required_credits: int
    minimum_gpa: Optional[float] = None

class DegreeEligibilityResponse(BaseModel):
    eligible: bool
    missing_courses: List[str]
    completed_courses: List[str]

# Certificate related request models
class IssueCertificateRequest(BaseModel):
    certificate_id: str
    course_id: str
    student: str
    metadata_uri: str

class RevokeCertificateRequest(BaseModel):
    certificate_id: str

class UpdateProgressRequest(BaseModel):
    student: str
    course_id: str
    progress: int

class CompleteCourseRequest(BaseModel):
    student: str
    course_id: str

class IssueDegreeRequest(BaseModel):
    degree_id: str
    student: str
    certificate_ids: List[str]
    degree_type: str
    metadata_uri: str

class RevokeDegreeRequest(BaseModel):
    degree_id: str

class AddCertificateToDegreeRequest(BaseModel):
    degree_id: str
    certificate_id: str

class SetDegreeRequirementsRequest(BaseModel):
    degree_type: str
    required_courses: List[str]
    required_credits: int
    minimum_gpa: Optional[float] = None

# QR code related models
class QRCodeRequest(BaseModel):
    data_type: str  # "certificate", "degree", or "course"
    id: str

class QRCodeResponse(BaseModel):
    data_type: str
    id: str
    verify_url: str
    qr_image: str  # Base64 encoded image

@router.post("/edumarket/mint")
def mint_course_nft(req: MintCourseNFTRequest):
    try:
        if is_contract_addr_invalid(EDUMARKET_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"mint_course_nft": req.dict()}
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    except Exception as e:
        if is_contract_addr_invalid(EDUMARKET_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edumarket/buy")
def buy_course_nft(req: BuyCourseNFTRequest):
    try:
        if is_contract_addr_invalid(EDUMARKET_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        exec_msg = {"buy_course_nft": req.dict()}
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
    except Exception as e:
        if is_contract_addr_invalid(EDUMARKET_CONTRACT_ADDR):
            raise HTTPException(status_code=404, detail="Contract address not set or not deployed")
        raise HTTPException(status_code=500, detail=str(e))

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

# Certificate related endpoints
@router.post("/edumarket/certificate/issue")
def issue_certificate(req: IssueCertificateRequest, request: Request):
    """Issue a new certificate for a completed course"""
    try:
        exec_msg = {"issue_certificate": req.dict()}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edumarket/certificate/revoke")
def revoke_certificate(req: RevokeCertificateRequest, request: Request):
    """Revoke a previously issued certificate"""
    try:
        exec_msg = {"revoke_certificate": req.dict()}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edumarket/course/progress")
def update_course_progress(req: UpdateProgressRequest, request: Request):
    """Update a student's progress in a course"""
    try:
        if req.progress < 0 or req.progress > 100:
            raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
        
        exec_msg = {"update_course_progress": req.dict()}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edumarket/course/complete")
def complete_course(req: CompleteCourseRequest, request: Request):
    """Mark a course as completed by a student"""
    try:
        exec_msg = {"complete_course": req.dict()}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/edumarket/certificate/{certificate_id}")
def get_certificate(certificate_id: str):
    """Get details about a specific certificate"""
    query_msg = {"get_certificate": {"certificate_id": certificate_id}}
    return wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)

@router.get("/edumarket/certificate/student/{student}")
def get_student_certificates(student: str):
    """Get all certificates for a specific student"""
    query_msg = {"get_student_certificates": {"student": student}}
    return wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)

@router.get("/edumarket/course/progress/{student}/{course_id}")
def get_course_progress(student: str, course_id: str):
    """Get a student's progress in a specific course"""
    query_msg = {"get_course_progress": {"student": student, "course_id": course_id}}
    return wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)

# Degree related endpoints
@router.post("/edumarket/degree/issue")
def issue_degree(req: IssueDegreeRequest, request: Request):
    """Issue a new degree composed of certificates"""
    try:
        exec_msg = {"issue_degree": req.dict()}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edumarket/degree/revoke")
def revoke_degree(req: RevokeDegreeRequest, request: Request):
    """Revoke a previously issued degree"""
    try:
        exec_msg = {"revoke_degree": req.dict()}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edumarket/degree/add-certificate")
def add_certificate_to_degree(req: AddCertificateToDegreeRequest, request: Request):
    """Add a certificate to an existing degree"""
    try:
        exec_msg = {"add_certificate_to_degree": req.dict()}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edumarket/degree/requirements")
def set_degree_requirements(req: SetDegreeRequirementsRequest, request: Request):
    """Set requirements for a specific degree type"""
    try:
        exec_msg = {"set_degree_requirements": req.dict()}
        sender = request.headers.get("X-Node-Id", "node1")
        return wasm_execute(EDUMARKET_CONTRACT_ADDR, exec_msg, sender)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/edumarket/degree/{degree_id}")
def get_degree(degree_id: str):
    """Get details about a specific degree"""
    query_msg = {"get_degree": {"degree_id": degree_id}}
    return wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)

@router.get("/edumarket/degree/student/{student}")
def get_student_degrees(student: str):
    """Get all degrees for a specific student"""
    query_msg = {"get_student_degrees": {"student": student}}
    return wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)

@router.get("/edumarket/degree/check-eligibility/{student}/{degree_type}")
def check_degree_eligibility(student: str, degree_type: str):
    """Check if a student is eligible for a specific degree"""
    query_msg = {"check_eligible_for_degree": {"student": student, "degree_type": degree_type}}
    return wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)

@router.get("/edumarket/degree/requirements/{degree_type}")
def get_degree_requirements(degree_type: str):
    """Get requirements for a specific degree type"""
    query_msg = {"get_degree_requirements": {"degree_type": degree_type}}
    return wasm_query(EDUMARKET_CONTRACT_ADDR, query_msg)

# QR code generation
@router.post("/edumarket/qrcode")
def generate_qr_code(req: QRCodeRequest):
    """Generate a QR code for a certificate, degree, or course"""
    try:
        # Determine verify URL based on type
        base_url = "https://vieduchainverify.edu.vn/"
        verify_url = f"{base_url}{req.data_type}/{req.id}"
        
        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECTION_H,
            box_size=10,
            border=4,
        )
        qr.add_data(verify_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert PIL image to base64 string
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Return the QR code data and image
        return QRCodeResponse(
            data_type=req.data_type,
            id=req.id,
            verify_url=verify_url,
            qr_image=img_str
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
