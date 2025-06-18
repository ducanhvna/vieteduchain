from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.services.permissions_service import PermissionsService
from api.models.node import Node
import os

router = APIRouter()

# Use config/initial_nodes.json as default
initial_nodes_file = os.getenv("INITIAL_NODES_FILE", "config/initial_nodes.json")
service = PermissionsService(initial_nodes_file)

class NodeRequest(BaseModel):
    id: str
    name: str = ""

class VoteRequest(BaseModel):
    node_id: str
    vote: str  # 'yes' or 'no'

@router.post("/service/request-permission")
def request_permission(node: NodeRequest):
    node_obj = Node(id=node.id, name=node.name, has_permission=False)
    return {"message": service.request_permission(node_obj)}

@router.post("/service/vote")
def vote_on_permission(vote: VoteRequest):
    return {"message": service.vote_on_permission(vote.node_id, vote.vote)}

@router.get("/service/check-permission/{node_id}")
def check_permission(node_id: str):
    return {"message": service.check_permission(node_id)}
