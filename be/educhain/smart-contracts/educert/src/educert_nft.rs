// NFT extension for EduCert contract
use cosmwasm_std::{Addr, Binary, Uint128};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// NFT-based credential
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CredentialNFT {
    pub token_id: String,        // Unique identifier for the NFT
    pub credential_hash: String, // Hash of the underlying credential
    pub owner: Addr,             // Current owner of the NFT (student)
    pub issuer: Addr,            // Issuer of the credential (school)
    pub metadata_uri: String,    // URI to the metadata (can be IPFS, HTTP, etc.)
    pub issued_at: u64,          // Timestamp when issued
    pub transferred: bool,       // Whether the NFT has been transferred
}

// School information for registration as a node
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct SchoolNode {
    pub did: String,             // DID of the school
    pub name: String,            // Name of the school
    pub address: Addr,           // Blockchain address of the school
    pub node_id: String,         // Node ID in the blockchain network
    pub service_endpoint: String, // Endpoint for the school's service
    pub active: bool,            // Whether the school node is active
    pub registered_at: u64,      // Timestamp when registered
}

// Functions for managing credential NFTs
pub fn nft_key(token_id: &str) -> Vec<u8> {
    ["nft:", token_id].concat().into_bytes()
}

pub fn school_node_key(did: &str) -> Vec<u8> {
    ["school:", did].concat().into_bytes()
}

// Enums for NFT operations
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum NFTOperation {
    Mint {
        recipient: Addr,
        token_id: String,
        credential_hash: String,
        metadata_uri: String,
    },
    Transfer {
        token_id: String,
        recipient: Addr,
    },
    Burn {
        token_id: String,
    },
}

// Node operations
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum SchoolNodeOperation {
    Register {
        did: String,
        name: String,
        service_endpoint: String,
        node_id: String,
    },
    Update {
        did: String,
        name: Option<String>,
        service_endpoint: Option<String>,
        active: Option<bool>,
    },
    Deactivate {
        did: String,
    },
}

// Transaction record for ledger
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct TransactionRecord {
    pub tx_id: String,
    pub tx_type: String,
    pub initiator: Addr,
    pub details: String,
    pub timestamp: u64,
}

pub fn tx_record_key(tx_id: &str) -> Vec<u8> {
    ["tx:", tx_id].concat().into_bytes()
}

// Execute operations for NFT and School Node
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum NFTExecuteMsg {
    MintCredentialNFT {
        token_id: String,
        credential_hash: String,
        recipient: String,
        metadata_uri: String,
    },
    TransferCredentialNFT {
        token_id: String,
        recipient: String,
    },
    BurnCredentialNFT {
        token_id: String,
    },
    RegisterSchoolNode {
        did: String,
        name: String,
        service_endpoint: String,
        node_id: String,
    },
    UpdateSchoolNode {
        did: String,
        name: Option<String>,
        service_endpoint: Option<String>,
        active: Option<bool>,
    },
    DeactivateSchoolNode {
        did: String,
    },
}

// Query operations for NFT and School Node
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum NFTQueryMsg {
    GetCredentialNFT { token_id: String },
    GetNFTsByOwner { owner: String },
    GetNFTsByIssuer { issuer: String },
    GetSchoolNode { did: String },
    ListSchoolNodes { active_only: Option<bool> },
    GetTransactionHistory { limit: Option<u32> },
}

// QR code data structure
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct QRCodeData {
    pub data_type: String,  // "nft" or "did"
    pub id: String,         // token_id or did
    pub verify_url: String, // URL to verify the data
}
