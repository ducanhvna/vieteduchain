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
}

func NewPermissionManager(initialNodes []string) *PermissionManager {
	pm := &PermissionManager{
		nodes:       make(map[string]*PermissionNode),
		initialNodes: initialNodes,
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

	if approve {
		node.HasVote = true
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

	return node.HasVote, nil
}