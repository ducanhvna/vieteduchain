// Minimal contract entry for CosmWasm
use cosmwasm_std::{entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, to_binary, from_binary, QueryRequest, Uint128, Addr, Order};
use schemars::JsonSchema;

// Import NFT extension
mod educert_nft;
use educert_nft::{CredentialNFT, SchoolNode, NFTExecuteMsg, NFTQueryMsg, QRCodeData, TransactionRecord};
use educert_nft::{nft_key, school_node_key, tx_record_key};

// -------- EduCert contract logic --------
// IssueVC: Lưu hash và metadata của credential
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Credential {
    pub hash: String,
    pub metadata: String,
    pub issuer: String,
    pub signature: String,
    pub revoked: bool,
    pub nft_token_id: Option<String>, // Link to NFT if minted
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum ExecuteMsg {
    IssueVC {
        hash: String,
        metadata: String,
        issuer: String,
        signature: String,
    },
    RevokeVC {
        hash: String,
    },
    // NFT Operations
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
    // School Node Operations
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

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum QueryMsg {
    IsRevoked { hash: String },
    GetCredential { hash: String },
    // NFT Queries
    GetCredentialNFT { token_id: String },
    GetNFTsByOwner { owner: String },
    GetNFTsByIssuer { issuer: String },
    // School Node Queries
    GetSchoolNode { did: String },
    ListSchoolNodes { active_only: Option<bool> },
    // Transaction History
    GetTransactionHistory { limit: Option<u32> },
    // QR Code
    GenerateQRCodeData { data_type: String, id: String },
}

use cosmwasm_std::{StdError, Storage};
use cosmwasm_std::attr;
use std::collections::HashMap;

const PREFIX: &str = "credential_";
const NFT_PREFIX: &str = "nft:";
const SCHOOL_PREFIX: &str = "school:";
const TX_PREFIX: &str = "tx:";
const BASE_VERIFY_URL: &str = "https://vieduchainverify.edu.vn/";

#[entry_point]
pub fn instantiate(_deps: DepsMut, _env: Env, _info: MessageInfo, _msg: ()) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: Binary) -> StdResult<Response> {
    let exec: ExecuteMsg = from_binary(&msg)?;
    match exec {
        ExecuteMsg::IssueVC { hash, metadata, issuer, signature } => {
            let key = format!("{}{}", PREFIX, hash);
            let cred = Credential {
                hash: hash.clone(),
                metadata,
                issuer,
                signature,
                revoked: false,
                nft_token_id: None,
            };
            deps.storage.set(key.as_bytes(), &to_binary(&cred)?);
            
            // Record transaction
            record_transaction(deps, &env, &info.sender, "issue_vc", &hash)?;
            
            Ok(Response::new().add_attribute("action", "issue_vc").add_attribute("issuer", info.sender))
        },
        ExecuteMsg::RevokeVC { hash } => {
            let key = format!("{}{}", PREFIX, hash);
            let cred_bin = deps.storage.get(key.as_bytes()).ok_or(StdError::not_found("Credential"))?;
            let mut cred: Credential = from_binary(&Binary(cred_bin))?;
            cred.revoked = true;
            deps.storage.set(key.as_bytes(), &to_binary(&cred)?);
            
            // Record transaction
            record_transaction(deps, &env, &info.sender, "revoke_vc", &hash)?;
            
            Ok(Response::new().add_attribute("action", "revoke_vc").add_attribute("hash", hash))
        },
        ExecuteMsg::MintCredentialNFT { token_id, credential_hash, recipient, metadata_uri } => {
            mint_nft(deps, env, info, token_id, credential_hash, recipient, metadata_uri)
        },
        ExecuteMsg::TransferCredentialNFT { token_id, recipient } => {
            transfer_nft(deps, env, info, token_id, recipient)
        },
        ExecuteMsg::BurnCredentialNFT { token_id } => {
            burn_nft(deps, env, info, token_id)
        },
        ExecuteMsg::RegisterSchoolNode { did, name, service_endpoint, node_id } => {
            register_school_node(deps, env, info, did, name, service_endpoint, node_id)
        },
        ExecuteMsg::UpdateSchoolNode { did, name, service_endpoint, active } => {
            update_school_node(deps, env, info, did, name, service_endpoint, active)
        },
        ExecuteMsg::DeactivateSchoolNode { did } => {
            deactivate_school_node(deps, env, info, did)
        },
    }
}

// NFT operations implementation
fn mint_nft(deps: DepsMut, env: Env, info: MessageInfo, token_id: String, credential_hash: String, recipient: String, metadata_uri: String) -> StdResult<Response> {
    // Check if NFT already exists
    let nft_key = nft_key(&token_id);
    if deps.storage.get(&nft_key).is_some() {
        return Err(StdError::generic_err("NFT already exists"));
    }
    
    // Check if credential exists
    let cred_key = format!("{}{}", PREFIX, credential_hash);
    let cred_bin = deps.storage.get(cred_key.as_bytes()).ok_or(StdError::not_found("Credential"))?;
    let mut cred: Credential = from_binary(&Binary(cred_bin))?;
    
    // Create NFT
    let recipient_addr = deps.api.addr_validate(&recipient)?;
    let nft = CredentialNFT {
        token_id: token_id.clone(),
        credential_hash: credential_hash.clone(),
        owner: recipient_addr.clone(),
        issuer: info.sender.clone(),
        metadata_uri,
        issued_at: env.block.time.seconds(),
        transferred: false,
    };
    
    // Store NFT
    deps.storage.set(&nft_key, &to_binary(&nft)?);
    
    // Update credential with NFT token ID
    cred.nft_token_id = Some(token_id.clone());
    deps.storage.set(cred_key.as_bytes(), &to_binary(&cred)?);
    
    // Record transaction
    record_transaction(deps, &env, &info.sender, "mint_nft", &format!("token_id: {}, credential: {}", token_id, credential_hash))?;
    
    Ok(Response::new()
        .add_attribute("action", "mint_credential_nft")
        .add_attribute("token_id", token_id)
        .add_attribute("credential_hash", credential_hash)
        .add_attribute("recipient", recipient_addr.to_string()))
}

fn transfer_nft(deps: DepsMut, env: Env, info: MessageInfo, token_id: String, recipient: String) -> StdResult<Response> {
    // Get NFT
    let key = nft_key(&token_id);
    let nft_bin = deps.storage.get(&key).ok_or(StdError::not_found("NFT"))?;
    let mut nft: CredentialNFT = from_binary(&Binary(nft_bin))?;
    
    // Check ownership
    if nft.owner != info.sender {
        return Err(StdError::generic_err("Not the owner of NFT"));
    }
    
    // Update owner
    let recipient_addr = deps.api.addr_validate(&recipient)?;
    nft.owner = recipient_addr.clone();
    nft.transferred = true;
    
    // Save updated NFT
    deps.storage.set(&key, &to_binary(&nft)?);
    
    // Record transaction
    record_transaction(deps, &env, &info.sender, "transfer_nft", &format!("token_id: {}, to: {}", token_id, recipient))?;
    
    Ok(Response::new()
        .add_attribute("action", "transfer_credential_nft")
        .add_attribute("token_id", token_id)
        .add_attribute("recipient", recipient))
}

fn burn_nft(deps: DepsMut, env: Env, info: MessageInfo, token_id: String) -> StdResult<Response> {
    // Get NFT
    let key = nft_key(&token_id);
    let nft_bin = deps.storage.get(&key).ok_or(StdError::not_found("NFT"))?;
    let nft: CredentialNFT = from_binary(&Binary(nft_bin))?;
    
    // Check ownership or issuer rights
    if nft.owner != info.sender && nft.issuer != info.sender {
        return Err(StdError::generic_err("Only owner or issuer can burn NFT"));
    }
    
    // Remove NFT
    deps.storage.remove(&key);
    
    // Record transaction
    record_transaction(deps, &env, &info.sender, "burn_nft", &format!("token_id: {}", token_id))?;
    
    Ok(Response::new()
        .add_attribute("action", "burn_credential_nft")
        .add_attribute("token_id", token_id))
}

// School node operations
fn register_school_node(deps: DepsMut, env: Env, info: MessageInfo, did: String, name: String, service_endpoint: String, node_id: String) -> StdResult<Response> {
    // Check if school node already exists
    let key = school_node_key(&did);
    if deps.storage.get(&key).is_some() {
        return Err(StdError::generic_err("School node already registered"));
    }
    
    // Create school node
    let school = SchoolNode {
        did: did.clone(),
        name,
        address: info.sender.clone(),
        node_id,
        service_endpoint,
        active: true,
        registered_at: env.block.time.seconds(),
    };
    
    // Store school node
    deps.storage.set(&key, &to_binary(&school)?);
    
    // Record transaction
    record_transaction(deps, &env, &info.sender, "register_school", &format!("did: {}", did))?;
    
    Ok(Response::new()
        .add_attribute("action", "register_school_node")
        .add_attribute("did", did)
        .add_attribute("address", info.sender.to_string()))
}

fn update_school_node(deps: DepsMut, env: Env, info: MessageInfo, did: String, name: Option<String>, service_endpoint: Option<String>, active: Option<bool>) -> StdResult<Response> {
    // Get school node
    let key = school_node_key(&did);
    let school_bin = deps.storage.get(&key).ok_or(StdError::not_found("School Node"))?;
    let mut school: SchoolNode = from_binary(&Binary(school_bin))?;
    
    // Check ownership
    if school.address != info.sender {
        return Err(StdError::generic_err("Not authorized to update school node"));
    }
    
    // Update fields
    if let Some(new_name) = name {
        school.name = new_name;
    }
    if let Some(new_endpoint) = service_endpoint {
        school.service_endpoint = new_endpoint;
    }
    if let Some(new_active) = active {
        school.active = new_active;
    }
    
    // Save updated school node
    deps.storage.set(&key, &to_binary(&school)?);
    
    // Record transaction
    record_transaction(deps, &env, &info.sender, "update_school", &format!("did: {}", did))?;
    
    Ok(Response::new()
        .add_attribute("action", "update_school_node")
        .add_attribute("did", did))
}

fn deactivate_school_node(deps: DepsMut, env: Env, info: MessageInfo, did: String) -> StdResult<Response> {
    // Get school node
    let key = school_node_key(&did);
    let school_bin = deps.storage.get(&key).ok_or(StdError::not_found("School Node"))?;
    let mut school: SchoolNode = from_binary(&Binary(school_bin))?;
    
    // Check ownership
    if school.address != info.sender {
        return Err(StdError::generic_err("Not authorized to deactivate school node"));
    }
    
    // Deactivate
    school.active = false;
    
    // Save updated school node
    deps.storage.set(&key, &to_binary(&school)?);
    
    // Record transaction
    record_transaction(deps, &env, &info.sender, "deactivate_school", &format!("did: {}", did))?;
    
    Ok(Response::new()
        .add_attribute("action", "deactivate_school_node")
        .add_attribute("did", did))
}

// Transaction recording
fn record_transaction(deps: DepsMut, env: &Env, sender: &Addr, tx_type: &str, details: &str) -> StdResult<()> {
    let tx_id = format!("{}-{}", env.block.time.seconds(), sender);
    let key = tx_record_key(&tx_id);
    
    let tx_record = TransactionRecord {
        tx_id: tx_id.clone(),
        tx_type: tx_type.to_string(),
        initiator: sender.clone(),
        details: details.to_string(),
        timestamp: env.block.time.seconds(),
    };
    
    deps.storage.set(&key, &to_binary(&tx_record)?);
    Ok(())
}

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: Binary) -> StdResult<Binary> {
    let query: QueryMsg = from_binary(&msg)?;
    match query {
        QueryMsg::IsRevoked { hash } => {
            let key = format!("{}{}", PREFIX, hash);
            let cred_bin = deps.storage.get(key.as_bytes());
            let revoked = if let Some(bin) = cred_bin {
                let cred: Credential = from_binary(&Binary(bin))?;
                cred.revoked
            } else {
                false
            };
            to_binary(&revoked)
        },
        QueryMsg::GetCredential { hash } => {
            let key = format!("{}{}", PREFIX, hash);
            let cred_bin = deps.storage.get(key.as_bytes()).ok_or(StdError::not_found("Credential"))?;
            to_binary(&from_binary::<Credential>(&Binary(cred_bin))?)
        },
        QueryMsg::GetCredentialNFT { token_id } => {
            let key = nft_key(&token_id);
            let nft_bin = deps.storage.get(&key).ok_or(StdError::not_found("NFT"))?;
            to_binary(&from_binary::<CredentialNFT>(&Binary(nft_bin))?)
        },
        QueryMsg::GetNFTsByOwner { owner } => {
            let owner_addr = deps.api.addr_validate(&owner)?;
            let nfts = query_nfts_by_owner(deps, &owner_addr)?;
            to_binary(&nfts)
        },
        QueryMsg::GetNFTsByIssuer { issuer } => {
            let issuer_addr = deps.api.addr_validate(&issuer)?;
            let nfts = query_nfts_by_issuer(deps, &issuer_addr)?;
            to_binary(&nfts)
        },
        QueryMsg::GetSchoolNode { did } => {
            let key = school_node_key(&did);
            let school_bin = deps.storage.get(&key).ok_or(StdError::not_found("School Node"))?;
            to_binary(&from_binary::<SchoolNode>(&Binary(school_bin))?)
        },
        QueryMsg::ListSchoolNodes { active_only } => {
            let schools = query_school_nodes(deps, active_only)?;
            to_binary(&schools)
        },
        QueryMsg::GetTransactionHistory { limit } => {
            let transactions = query_transaction_history(deps, limit)?;
            to_binary(&transactions)
        },
        QueryMsg::GenerateQRCodeData { data_type, id } => {
            let qr_data = generate_qr_code_data(data_type, id)?;
            to_binary(&qr_data)
        },
    }
}

// Query helper functions
fn query_nfts_by_owner(deps: Deps, owner: &Addr) -> StdResult<Vec<CredentialNFT>> {
    let mut nfts = Vec::new();
    let nft_prefix = NFT_PREFIX.as_bytes();
    
    for item in deps.storage.range(Some(nft_prefix.to_vec()), None, Order::Ascending) {
        if let Ok((_, value)) = item {
            let nft: CredentialNFT = from_binary(&Binary(value))?;
            if nft.owner == *owner {
                nfts.push(nft);
            }
        }
    }
    
    Ok(nfts)
}

fn query_nfts_by_issuer(deps: Deps, issuer: &Addr) -> StdResult<Vec<CredentialNFT>> {
    let mut nfts = Vec::new();
    let nft_prefix = NFT_PREFIX.as_bytes();
    
    for item in deps.storage.range(Some(nft_prefix), None, Order::Ascending) {
        if let Ok((_, value)) = item {
            let nft: CredentialNFT = from_binary(&Binary(value))?;
            if nft.issuer == *issuer {
                nfts.push(nft);
            }
        }
    }
    
    Ok(nfts)
}

fn query_school_nodes(deps: Deps, active_only: Option<bool>) -> StdResult<Vec<SchoolNode>> {
    let mut schools = Vec::new();
    let school_prefix = SCHOOL_PREFIX.as_bytes();
    
    for item in deps.storage.range(Some(school_prefix), None, Order::Ascending) {
        if let Ok((_, value)) = item {
            let school: SchoolNode = from_binary(&Binary(value))?;
            if let Some(true) = active_only {
                if school.active {
                    schools.push(school);
                }
            } else {
                schools.push(school);
            }
        }
    }
    
    Ok(schools)
}

fn query_transaction_history(deps: Deps, limit: Option<u32>) -> StdResult<Vec<TransactionRecord>> {
    let mut transactions = Vec::new();
    let tx_prefix = TX_PREFIX.as_bytes();
    let limit = limit.unwrap_or(100) as usize;
    
    for item in deps.storage.range(Some(tx_prefix), None, Order::Descending) {
        if let Ok((_, value)) = item {
            let tx: TransactionRecord = from_binary(&Binary(value))?;
            transactions.push(tx);
            
            if transactions.len() >= limit {
                break;
            }
        }
    }
    
    Ok(transactions)
}

fn generate_qr_code_data(data_type: String, id: String) -> StdResult<QRCodeData> {
    let verify_url = match data_type.as_str() {
        "nft" => format!("{}{}/{}", BASE_VERIFY_URL, "nft", id),
        "did" => format!("{}{}/{}", BASE_VERIFY_URL, "did", id),
        _ => return Err(StdError::generic_err("Invalid data type for QR code")),
    };
    
    Ok(QRCodeData {
        data_type,
        id,
        verify_url,
    })
}
