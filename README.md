# Cosmos Permissioned Network

## Overview
The Cosmos Permissioned Network is a decentralized application built using the Cosmos SDK and FastAPI. This project implements a permission management system for nodes, where new nodes require approval from existing nodes with granting permissions. The initial nodes with granting permissions are predefined in the configuration.

## Project Structure
```
cosmos-permissioned-network
├── core                # Core components developed in Golang
│   ├── cmd             # Entry point for the Cosmos SDK application
│   ├── internal        # Internal application logic
│   ├── proto           # Protocol Buffers definitions
│   └── go.mod          # Go module definition
├── api                 # API components developed using FastAPI
│   ├── main.py         # Entry point for the FastAPI application
│   ├── routers         # API route definitions
│   ├── models          # Data models for API requests/responses
│   └── services        # Business logic for handling permissions
├── deploy              # Deployment configuration
│   ├── docker-compose.yml # Docker Compose configuration
│   ├── Dockerfile.core  # Dockerfile for the core application
│   └── Dockerfile.api   # Dockerfile for the FastAPI application
├── config              # Configuration files
│   └── initial_nodes.json # Predefined list of initial nodes
├── .gitignore          # Git ignore file
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites
- Go (version 1.16 or higher)
- Python (version 3.7 or higher)
- Docker and Docker Compose

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd cosmos-permissioned-network
   ```

2. Build the core application:
   ```
   cd core
   go build -o cosmos-core ./cmd/main.go
   ```

3. Set up the FastAPI application:
   ```
   cd api
   pip install -r requirements.txt
   ```

### Running the Application

To run the application using Docker Compose, execute the following command from the root of the project:
```
docker-compose up --build
```

### API Endpoints
- **Request Permission**: Endpoint for nodes to request permission to join the network.
- **Vote on Permission**: Endpoint for existing nodes to vote on permission requests.

### Contribution
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

### License
This project is licensed under the MIT License. See the LICENSE file for details.