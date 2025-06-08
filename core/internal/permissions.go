package internal

import (
	"errors"
	"sync"
)

type PermissionNode struct {
	ID          string
	HasVote     bool
	CanGrant    bool
}

type PermissionManager struct {
	mu          sync.Mutex
	nodes       map[string]*PermissionNode
	initialNodes []string
	votes       map[string]map[string]bool // nodeID -> map[voterID]approve
}

func NewPermissionManager(initialNodes []string) *PermissionManager {
	pm := &PermissionManager{
		nodes:       make(map[string]*PermissionNode),
		initialNodes: initialNodes,
		votes:       make(map[string]map[string]bool),
	}
	pm.initializeNodes()
	return pm
}

func (pm *PermissionManager) initializeNodes() {
	for _, id := range pm.initialNodes {
		pm.nodes[id] = &PermissionNode{ID: id, CanGrant: true}
	}
}

func (pm *PermissionManager) RequestPermission(nodeID string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if _, exists := pm.nodes[nodeID]; exists {
		return errors.New("node already exists")
	}

	pm.nodes[nodeID] = &PermissionNode{ID: nodeID, HasVote: false, CanGrant: false}
	pm.votes[nodeID] = make(map[string]bool)
	return nil
}

func (pm *PermissionManager) Vote(nodeID string, voterID string, approve bool) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	voter, exists := pm.nodes[voterID]
	if !exists || !voter.CanGrant {
		return errors.New("voter does not have permission to grant")
	}

	node, exists := pm.nodes[nodeID]
	if !exists {
		return errors.New("node does not exist")
	}

	if _, ok := pm.votes[nodeID]; !ok {
		pm.votes[nodeID] = make(map[string]bool)
	}
	pm.votes[nodeID][voterID] = approve

	// Đếm số granting nodes hiện tại
	grantingCount := 0
	for _, n := range pm.nodes {
		if n.CanGrant {
			grantingCount++
		}
	}
	if grantingCount == 0 {
		return errors.New("no granting nodes available")
	}

	// Đếm số phiếu yes
	yesCount := 0
	for _, v := range pm.votes[nodeID] {
		if v {
			yesCount++
		}
	}

	// Nếu số phiếu yes > 50% granting nodes thì cấp quyền
	if yesCount > grantingCount/2 {
		node.HasVote = true
		node.CanGrant = true
	}

	return nil
}

func (pm *PermissionManager) CheckPermission(nodeID string) (bool, error) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	node, exists := pm.nodes[nodeID]
	if !exists {
		return false, errors.New("node does not exist")
	}

	return node.CanGrant, nil
}