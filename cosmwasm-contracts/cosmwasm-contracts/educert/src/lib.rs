// Minimal contract entry for CosmWasm
use cosmwasm_std::{entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, to_json_binary, from_json, QueryRequest};
use schemars::JsonSchema;

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
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum QueryMsg {
    IsRevoked { hash: String },
    GetCredential { hash: String },
}

use cosmwasm_std::{StdError, Storage, Addr};
use cosmwasm_std::attr;
use std::collections::HashMap;

const PREFIX: &str = "credential_";

#[entry_point]
pub fn instantiate(_deps: DepsMut, _env: Env, _info: MessageInfo, _msg: ()) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, _env: Env, info: MessageInfo, msg: Binary) -> StdResult<Response> {
    let exec: ExecuteMsg = from_json(&msg)?;
    match exec {
        ExecuteMsg::IssueVC { hash, metadata, issuer, signature } => {
            let key = format!("{}{}", PREFIX, hash);
            let cred = Credential {
                hash: hash.clone(),
                metadata,
                issuer,
                signature,
                revoked: false,
            };
            deps.storage.set(key.as_bytes(), &to_json_binary(&cred)?);
            Ok(Response::new().add_attribute("action", "issue_vc").add_attribute("issuer", info.sender))
        },
        ExecuteMsg::RevokeVC { hash } => {
            let key = format!("{}{}", PREFIX, hash);
            let cred_bin = deps.storage.get(key.as_bytes()).ok_or(StdError::not_found("Credential"))?;
            let mut cred: Credential = from_json(&Binary(cred_bin))?;
            cred.revoked = true;
            deps.storage.set(key.as_bytes(), &to_json_binary(&cred)?);
            Ok(Response::new().add_attribute("action", "revoke_vc").add_attribute("hash", hash))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: Binary) -> StdResult<Binary> {
    let query: QueryMsg = from_json(&msg)?;
    match query {
        QueryMsg::IsRevoked { hash } => {
            let key = format!("{}{}", PREFIX, hash);
            let cred_bin = deps.storage.get(key.as_bytes());
            let revoked = if let Some(bin) = cred_bin {
                let cred: Credential = from_json(&Binary(bin))?;
                cred.revoked
            } else {
                false
            };
            to_json_binary(&revoked)
        },
        QueryMsg::GetCredential { hash } => {
            let key = format!("{}{}", PREFIX, hash);
            let cred_bin = deps.storage.get(key.as_bytes()).ok_or(StdError::not_found("Credential"))?;
            to_json_binary(&from_json::<Credential>(&Binary(cred_bin))?)
        }
    }
}
