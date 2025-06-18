from fastapi import HTTPException
from typing import List, Dict
from models.node import Node
import json
import os

class PermissionsService:
    def __init__(self, initial_nodes_file: str):
        self.initial_nodes = self.load_initial_nodes(initial_nodes_file)
        self.votes = {}

    def load_initial_nodes(self, file_path: str) -> List[str]:
        # Nếu file_path là path tương đối, chuyển sang tuyệt đối dựa trên vị trí file này
        if not os.path.isabs(file_path):
            base_dir = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(base_dir, '..', file_path)
            file_path = os.path.abspath(file_path)
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data.get("initial_nodes", [])

    def request_permission(self, node: Node) -> str:
        if node.id in self.initial_nodes:
            raise HTTPException(status_code=400, detail="Node already has permission.")
        self.votes[node.id] = {"yes": 0, "no": 0}
        return "Permission request submitted."

    def vote_on_permission(self, node_id: str, vote: str) -> str:
        if node_id not in self.votes:
            raise HTTPException(status_code=404, detail="Permission request not found.")
        
        if vote not in ["yes", "no"]:
            raise HTTPException(status_code=400, detail="Vote must be 'yes' or 'no'.")

        self.votes[node_id][vote] += 1
        return f"Vote recorded: {vote} for node {node_id}."

    def check_permission(self, node_id: str) -> str:
        if node_id in self.initial_nodes:
            return "Node has permission."
        
        if node_id in self.votes:
            total_votes = self.votes[node_id]["yes"] + self.votes[node_id]["no"]
            if total_votes > 0 and self.votes[node_id]["yes"] > total_votes / 2:
                return "Node granted permission."
            return "Node permission pending."
        
        return "Node permission request not found."