from fastapi import APIRouter, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
import json

router = APIRouter()

class NodeProfile(BaseModel):
    id: str
    name: Optional[str] = None
    address: Optional[str] = None

class NodeInfoResponse(BaseModel):
    granted_nodes: List[NodeProfile]
    current_node: Optional[NodeProfile] = None
    current_permission: bool

# Load initial nodes from config
CONFIG_PATH = os.getenv("INITIAL_NODES_FILE", "config/initial_nodes.json")
def load_initial_nodes() -> List[Dict[str, Any]]:
    try:
        with open(CONFIG_PATH, 'r') as f:
            data = json.load(f)
        return data.get("initial_nodes", [])
    except Exception:
        return []

# In-memory permissions (import from permissions.py)
try:
    from .permissions import permissions
except ImportError:
    permissions = {}

@router.get("/nodeinfo", response_model=NodeInfoResponse)
def get_nodeinfo(request: Request):
    """
    Trả về danh sách node có quyền, kèm thông tin node hiện tại (theo NODE_ID env)
    """
    initial_nodes = load_initial_nodes()
    # Lấy NODE_ID hiện tại từ env (nếu có)
    current_node_id = os.getenv("NODE_ID", "")
    # Danh sách node có quyền (theo permissions hoặc mặc định initial_nodes)
    granted_ids = set([node for node, granted in permissions.items() if granted])
    # Nếu permissions rỗng, lấy toàn bộ initial_nodes là granted
    if not permissions:
        granted_ids = set([n['id'] for n in initial_nodes])
    # Lấy thông tin node có quyền
    granted_nodes = [NodeProfile(**n) for n in initial_nodes if n['id'] in granted_ids]
    # Thông tin node hiện tại
    current_node = next((NodeProfile(**n) for n in initial_nodes if n['id'] == current_node_id), None)
    # Quyền của node hiện tại
    current_permission = current_node_id in granted_ids if current_node_id else False
    return NodeInfoResponse(
        granted_nodes=granted_nodes,
        current_node=current_node,
        current_permission=current_permission
    )
