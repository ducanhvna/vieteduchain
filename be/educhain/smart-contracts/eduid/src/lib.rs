// Minimal contract entry for CosmWasm
use cosmwasm_std::{entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, to_json_binary, from_json, QueryRequest, Addr, Storage};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

// DID Document structure (simplified, can be extended)
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct DIDDocument {
    pub context: String, // e.g. "https://www.w3.org/ns/did/v1"
    pub id: String,      // DID string
    pub public_key: String, // base58 or hex
    pub service_endpoint: Option<String>,
    // ... add more fields as needed
}

// InstantiateMsg (no params for now)
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

// ExecuteMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    RegisterDID { did_doc: DIDDocument },
    UpdateDID { did_doc: DIDDocument },
}

// QueryMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetDID { did: String },
    GetDIDHash { did: String },
}

const DID_DOC_KEY_PREFIX: &str = "did_doc:";
const DID_HASH_KEY_PREFIX: &str = "did_hash:";

fn did_doc_key(did: &str) -> Vec<u8> {
    [DID_DOC_KEY_PREFIX.as_bytes(), did.as_bytes()].concat()
}
fn did_hash_key(did: &str) -> Vec<u8> {
    [DID_HASH_KEY_PREFIX.as_bytes(), did.as_bytes()].concat()
}

#[entry_point]
pub fn instantiate(_deps: DepsMut, _env: Env, _info: MessageInfo, _msg: InstantiateMsg) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, _env: Env, info: MessageInfo, msg: Binary) -> StdResult<Response> {
    let exec_msg: ExecuteMsg = from_json(&msg)?;
    match exec_msg {
        ExecuteMsg::RegisterDID { did_doc } => try_register_did(deps, info, did_doc),
        ExecuteMsg::UpdateDID { did_doc } => try_update_did(deps, info, did_doc),
    }
}

fn try_register_did(deps: DepsMut, info: MessageInfo, did_doc: DIDDocument) -> StdResult<Response> {
    let did = did_doc.id.clone();
    let key = did_doc_key(&did);
    // Check if DID already exists
    if deps.storage.get(&key).is_some() {
        return Err(cosmwasm_std::StdError::generic_err("DID already registered"));
    }
    let doc_bin = to_json_binary(&did_doc)?;
    deps.storage.set(&key, doc_bin.as_slice());
    // Hash and store hash
    let mut hasher = Sha256::new();
    hasher.update(&doc_bin);
    let hash = hasher.finalize();
    deps.storage.set(&did_hash_key(&did), &hash);
    Ok(Response::new().add_attribute("action", "register_did").add_attribute("did", did))
}

fn try_update_did(deps: DepsMut, info: MessageInfo, did_doc: DIDDocument) -> StdResult<Response> {
    let did = did_doc.id.clone();
    let key = did_doc_key(&did);
    // Only allow update if DID exists
    if deps.storage.get(&key).is_none() {
        return Err(cosmwasm_std::StdError::not_found("DID"));
    }
    let doc_bin = to_json_binary(&did_doc)?;
    deps.storage.set(&key, doc_bin.as_slice());
    // Hash and store hash
    let mut hasher = Sha256::new();
    hasher.update(&doc_bin);
    let hash = hasher.finalize();
    deps.storage.set(&did_hash_key(&did), &hash);
    Ok(Response::new().add_attribute("action", "update_did").add_attribute("did", did))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: Binary) -> StdResult<Binary> {
    let query_msg: QueryMsg = from_json(&msg)?;
    match query_msg {
        QueryMsg::GetDID { did } => {
            let key = did_doc_key(&did);
            let doc_bin = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("DIDDocument"))?;
            to_json_binary(&from_json::<DIDDocument>(&Binary(doc_bin))?)
        },
        QueryMsg::GetDIDHash { did } => {
            let key = did_hash_key(&did);
            let hash_bin = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("DIDHash"))?;
            to_json_binary(&hash_bin)
        }
    }
}
