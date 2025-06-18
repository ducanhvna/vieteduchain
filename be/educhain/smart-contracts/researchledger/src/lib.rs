// Minimal contract entry for CosmWasm
use cosmwasm_std::{entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, to_json_binary, from_json, Addr, Coin, BankMsg, Uint128};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// Data fingerprint registration
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct HashRecord {
    pub hash: String, // SHA-256
    pub owner: Addr,
    pub timestamp: u64,
    pub cid: Option<String>, // IPFS CID
    pub doi: Option<String>, // DOI string
    pub authors: Option<Vec<String>>,
    pub nft_id: Option<String>,
}

// Plagiarism bounty claim
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct BountyClaim {
    pub original_hash: String,
    pub plagiarized_hash: String,
    pub claimer: Addr,
    pub rewarded: bool,
}

// InstantiateMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

// ExecuteMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    RegisterHash { hash: String, cid: Option<String>, doi: Option<String>, authors: Option<Vec<String>> },
    MintDOINFT { hash: String, doi: String },
    SubmitPlagiarism { original_hash: String, plagiarized_hash: String },
    RewardBounty { claim_id: String },
}

// QueryMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetHashRecord { hash: String },
    GetBountyClaim { claim_id: String },
}

const HASH_PREFIX: &str = "hash:";
const BOUNTY_PREFIX: &str = "bounty:";

fn hash_key(hash: &str) -> Vec<u8> {
    [HASH_PREFIX.as_bytes(), hash.as_bytes()].concat()
}
fn bounty_key(claim_id: &str) -> Vec<u8> {
    [BOUNTY_PREFIX.as_bytes(), claim_id.as_bytes()].concat()
}

#[entry_point]
pub fn instantiate(_deps: DepsMut, _env: Env, _info: MessageInfo, _msg: InstantiateMsg) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: Binary) -> StdResult<Response> {
    let exec_msg: ExecuteMsg = from_json(&msg)?;
    match exec_msg {
        ExecuteMsg::RegisterHash { hash, cid, doi, authors } => register_hash(deps, env, info, hash, cid, doi, authors),
        ExecuteMsg::MintDOINFT { hash, doi } => mint_doi_nft(deps, env, info, hash, doi),
        ExecuteMsg::SubmitPlagiarism { original_hash, plagiarized_hash } => submit_plagiarism(deps, env, info, original_hash, plagiarized_hash),
        ExecuteMsg::RewardBounty { claim_id } => reward_bounty(deps, env, info, claim_id),
    }
}

fn register_hash(deps: DepsMut, env: Env, info: MessageInfo, hash: String, cid: Option<String>, doi: Option<String>, authors: Option<Vec<String>>) -> StdResult<Response> {
    let key = hash_key(&hash);
    if deps.storage.get(&key).is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Hash already registered"));
    }
    let record = HashRecord {
        hash: hash.clone(),
        owner: info.sender.clone(),
        timestamp: env.block.time.seconds(),
        cid,
        doi,
        authors,
        nft_id: None,
    };
    deps.storage.set(&key, &to_json_binary(&record)?);
    Ok(Response::new().add_attribute("action", "register_hash").add_attribute("hash", hash))
}

fn mint_doi_nft(deps: DepsMut, env: Env, info: MessageInfo, hash: String, doi: String) -> StdResult<Response> {
    let key = hash_key(&hash);
    let record_bin = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("HashRecord"))?;
    let mut record: HashRecord = from_json(&Binary(record_bin))?;
    if record.owner != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Only owner can mint NFT"));
    }
    // Mint NFT (simulate by setting nft_id)
    let nft_id = format!("nft:{}:{}", doi, hash);
    record.nft_id = Some(nft_id.clone());
    record.doi = Some(doi.clone());
    deps.storage.set(&key, &to_json_binary(&record)?);
    Ok(Response::new().add_attribute("action", "mint_doi_nft").add_attribute("hash", hash).add_attribute("nft_id", nft_id))
}

fn submit_plagiarism(deps: DepsMut, env: Env, info: MessageInfo, original_hash: String, plagiarized_hash: String) -> StdResult<Response> {
    let claim_id = format!("{}:{}:{}", original_hash, plagiarized_hash, env.block.time.seconds());
    let key = bounty_key(&claim_id);
    if deps.storage.get(&key).is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Claim already exists"));
    }
    let claim = BountyClaim {
        original_hash: original_hash.clone(),
        plagiarized_hash: plagiarized_hash.clone(),
        claimer: info.sender.clone(),
        rewarded: false,
    };
    deps.storage.set(&key, &to_json_binary(&claim)?);
    Ok(Response::new().add_attribute("action", "submit_plagiarism").add_attribute("claim_id", claim_id))
}

fn reward_bounty(deps: DepsMut, env: Env, info: MessageInfo, claim_id: String) -> StdResult<Response> {
    let key = bounty_key(&claim_id);
    let mut claim: BountyClaim = from_json(&Binary(deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("BountyClaim"))?))?;
    if claim.rewarded {
        return Err(cosmwasm_std::StdError::generic_err("Already rewarded"));
    }
    // Only contract owner or original_hash owner can reward (for demo, allow anyone)
    claim.rewarded = true;
    deps.storage.set(&key, &to_json_binary(&claim)?);
    // Simulate sending RESEARCH token (not implemented)
    Ok(Response::new().add_attribute("action", "reward_bounty").add_attribute("claim_id", claim_id))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: Binary) -> StdResult<Binary> {
    let query_msg: QueryMsg = from_json(&msg)?;
    match query_msg {
        QueryMsg::GetHashRecord { hash } => {
            let key = hash_key(&hash);
            let record = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("HashRecord"))?;
            Ok(Binary(record))
        },
        QueryMsg::GetBountyClaim { claim_id } => {
            let key = bounty_key(&claim_id);
            let claim = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("BountyClaim"))?;
            Ok(Binary(claim))
        },
    }
}
