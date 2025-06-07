package internal

type Node struct {
    ID          string
    Address     string
    Permissions []string
    Voted       bool
}

func NewNode(id string, address string) *Node {
    return &Node{
        ID:          id,
        Address:     address,
        Permissions: []string{},
        Voted:       false,
    }
}

func (n *Node) GrantPermission(permission string) {
    n.Permissions = append(n.Permissions, permission)
}

func (n *Node) RevokePermission(permission string) {
    for i, p := range n.Permissions {
        if p == permission {
            n.Permissions = append(n.Permissions[:i], n.Permissions[i+1:]...)
            break
        }
    }
}

func (n *Node) HasPermission(permission string) bool {
    for _, p := range n.Permissions {
        if p == permission {
            return true
        }
    }
    return false
}