// Minimal contract entry for CosmWasm
use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
    Addr, Uint128, Storage,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cw_storage_plus::{Item, Map};

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

// Define storage for hash records and bounty claims
const HASH_RECORDS: Map<&str, HashRecord> = Map::new("hash_records");
const BOUNTY_CLAIMS: Map<&str, BountyClaim> = Map::new("bounty_claims");

#[entry_point]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg
) -> StdResult<Response> {
    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::RegisterHash { hash, cid, doi, authors } => 
            register_hash(deps, env, info, hash, cid, doi, authors),
        ExecuteMsg::MintDOINFT { hash, doi } => 
            mint_doi_nft(deps, env, info, hash, doi),
        ExecuteMsg::SubmitPlagiarism { original_hash, plagiarized_hash } => 
            submit_plagiarism(deps, env, info, original_hash, plagiarized_hash),
        ExecuteMsg::RewardBounty { claim_id } => 
            reward_bounty(deps, env, info, claim_id),
    }
}

fn register_hash(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    hash: String,
    cid: Option<String>,
    doi: Option<String>,
    authors: Option<Vec<String>>,
) -> StdResult<Response> {
    if HASH_RECORDS.may_load(deps.storage, &hash)?.is_some() {
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
    
    HASH_RECORDS.save(deps.storage, &hash, &record)?;
    
    Ok(Response::new()
        .add_attribute("action", "register_hash")
        .add_attribute("hash", hash))
}

fn mint_doi_nft(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    hash: String,
    doi: String,
) -> StdResult<Response> {
    let mut record = HASH_RECORDS.load(deps.storage, &hash)?;
    
    if record.owner != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Only owner can mint NFT"));
    }
    
    // Mint NFT (simulate by setting nft_id)
    let nft_id = format!("nft:{}:{}", doi, hash);
    record.nft_id = Some(nft_id.clone());
    record.doi = Some(doi.clone());
    
    HASH_RECORDS.save(deps.storage, &hash, &record)?;
    
    Ok(Response::new()
        .add_attribute("action", "mint_doi_nft")
        .add_attribute("hash", hash)
        .add_attribute("nft_id", nft_id))
}

fn submit_plagiarism(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    original_hash: String,
    plagiarized_hash: String,
) -> StdResult<Response> {
    let claim_id = format!("{}:{}:{}", original_hash, plagiarized_hash, env.block.time.seconds());
    
    if BOUNTY_CLAIMS.may_load(deps.storage, &claim_id)?.is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Claim already exists"));
    }
    
    let claim = BountyClaim {
        original_hash: original_hash.clone(),
        plagiarized_hash: plagiarized_hash.clone(),
        claimer: info.sender.clone(),
        rewarded: false,
    };
    
    BOUNTY_CLAIMS.save(deps.storage, &claim_id, &claim)?;
    
    Ok(Response::new()
        .add_attribute("action", "submit_plagiarism")
        .add_attribute("claim_id", claim_id))
}

fn reward_bounty(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    claim_id: String,
) -> StdResult<Response> {
    let mut claim = BOUNTY_CLAIMS.load(deps.storage, &claim_id)?;
    
    if claim.rewarded {
        return Err(cosmwasm_std::StdError::generic_err("Already rewarded"));
    }
    
    // Only contract owner or original_hash owner can reward (for demo, allow anyone)
    claim.rewarded = true;
    BOUNTY_CLAIMS.save(deps.storage, &claim_id, &claim)?;
    
    // Simulate sending RESEARCH token (not implemented)
    Ok(Response::new()
        .add_attribute("action", "reward_bounty")
        .add_attribute("claim_id", claim_id))
}

#[entry_point]
pub fn query(
    deps: Deps,
    _env: Env,
    msg: QueryMsg
) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetHashRecord { hash } => {
            let record = HASH_RECORDS.load(deps.storage, &hash)?;
            to_binary(&record)
        },
        QueryMsg::GetBountyClaim { claim_id } => {
            let claim = BOUNTY_CLAIMS.load(deps.storage, &claim_id)?;
            to_binary(&claim)
        },
    }
}
