from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class PermissionRequest(BaseModel):
    node_id: str

class VoteRequest(BaseModel):
    node_id: str
    vote: bool

class PermissionResponse(BaseModel):
    success: bool
    message: str

# In-memory storage for permissions and votes
permissions = {}
votes = {}

@router.post("/request-permission", response_model=PermissionResponse)
async def request_permission(permission_request: PermissionRequest):
    if permission_request.node_id in permissions:
        raise HTTPException(status_code=400, detail="Node already has permission.")
    
    # Logic to handle permission request
    permissions[permission_request.node_id] = False  # Initially set to False until voted on
    return {"success": True, "message": "Permission request submitted."}

@router.post("/vote", response_model=PermissionResponse)
async def vote(vote_request: VoteRequest):
    if vote_request.node_id not in permissions:
        raise HTTPException(status_code=404, detail="Node not found.")
    
    # Logic to handle voting
    if vote_request.vote:
        permissions[vote_request.node_id] = True  # Grant permission
        return {"success": True, "message": "Permission granted."}
    else:
        return {"success": True, "message": "Permission denied."}

@router.get("/permissions", response_model=List[str])
async def get_permissions():
    return [node for node, granted in permissions.items() if granted]