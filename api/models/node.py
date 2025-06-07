class Node:
    def __init__(self, id: str, name: str, has_permission: bool):
        self.id = id
        self.name = name
        self.has_permission = has_permission

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "has_permission": self.has_permission
        }

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data.get("id"),
            name=data.get("name"),
            has_permission=data.get("has_permission", False)
        )