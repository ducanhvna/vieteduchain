// Minimal contract entry for CosmWasm
use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
    Addr, Order,
};
use serde::{Serialize, Deserialize};
use schemars::JsonSchema;
use cw_storage_plus::{Item, Map};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct SeatNFT {
    pub id: String,
    pub owner: Option<Addr>, // None = available, Some = assigned
    pub burned: bool,
}

// Candidate score
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CandidateScore {
    pub candidate_hash: String,
    pub score: u32,
}

// Admission result
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AdmissionResult {
    pub candidate_hash: String,
    pub seat_id: Option<String>,
    pub admitted: bool,
    pub score: u32,
}

// InstantiateMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

// ExecuteMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    MintSeatNFT { seat_id: String },
    BurnSeatNFT { seat_id: String },
    PushScore { candidate_hash: String, score: u32 },
    RunMatching {},
}

// QueryMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetSeatNFT { seat_id: String },
    GetCandidateScore { candidate_hash: String },
    GetAdmissionResult { candidate_hash: String },
    ListAdmissionResults {},
}

// Define storage
const SEATS: Map<&str, SeatNFT> = Map::new("seats");
const SCORES: Map<&str, CandidateScore> = Map::new("scores");
const RESULTS: Map<&str, AdmissionResult> = Map::new("results");

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
        ExecuteMsg::MintSeatNFT { seat_id } => 
            mint_seat_nft(deps, info, seat_id),
        ExecuteMsg::BurnSeatNFT { seat_id } => 
            burn_seat_nft(deps, info, seat_id),
        ExecuteMsg::PushScore { candidate_hash, score } => 
            push_score(deps, info, candidate_hash, score),
        ExecuteMsg::RunMatching {} => 
            run_matching(deps, env),
    }
}

fn mint_seat_nft(
    deps: DepsMut,
    _info: MessageInfo,
    seat_id: String
) -> StdResult<Response> {
    if SEATS.may_load(deps.storage, &seat_id)?.is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Seat already exists"));
    }
    
    let seat = SeatNFT { id: seat_id.clone(), owner: None, burned: false };
    SEATS.save(deps.storage, &seat_id, &seat)?;
    
    Ok(Response::new()
        .add_attribute("action", "mint_seat_nft")
        .add_attribute("seat_id", seat_id))
}

fn burn_seat_nft(
    deps: DepsMut,
    _info: MessageInfo,
    seat_id: String
) -> StdResult<Response> {
    let mut seat = SEATS.load(deps.storage, &seat_id)?;
    
    if seat.burned {
        return Err(cosmwasm_std::StdError::generic_err("Seat already burned"));
    }
    
    seat.burned = true;
    SEATS.save(deps.storage, &seat_id, &seat)?;
    
    Ok(Response::new()
        .add_attribute("action", "burn_seat_nft")
        .add_attribute("seat_id", seat_id))
}

fn push_score(
    deps: DepsMut,
    _info: MessageInfo,
    candidate_hash: String,
    score: u32
) -> StdResult<Response> {
    let score_rec = CandidateScore { candidate_hash: candidate_hash.clone(), score };
    SCORES.save(deps.storage, &candidate_hash, &score_rec)?;
    
    Ok(Response::new()
        .add_attribute("action", "push_score")
        .add_attribute("candidate_hash", candidate_hash))
}

fn run_matching(deps: DepsMut, _env: Env) -> StdResult<Response> {
    // Simple matching: assign top scores to available seats
    let mut scores: Vec<CandidateScore> = vec![];
    let mut seats: Vec<SeatNFT> = vec![];
    let mut results: Vec<AdmissionResult> = vec![];
    
    // Collect all scores
    let score_iter = SCORES.range(deps.storage, None, None, Order::Ascending);
    for item in score_iter {
        let (_, score) = item?;
        scores.push(score);
    }
    
    // Collect all available seats
    let seat_iter = SEATS.range(deps.storage, None, None, Order::Ascending);
    for item in seat_iter {
        let (_, seat) = item?;
        if !seat.burned && seat.owner.is_none() {
            seats.push(seat);
        }
    }
    
    // Sort scores descending
    scores.sort_by(|a, b| b.score.cmp(&a.score));
    
    // Assign seats
    for (i, candidate) in scores.iter().enumerate() {
        let seat = seats.get(i);
        let result = AdmissionResult {
            candidate_hash: candidate.candidate_hash.clone(),
            seat_id: seat.map(|s| s.id.clone()),
            admitted: seat.is_some(),
            score: candidate.score,
        };
        
        // Update seat owner if assigned
        if let Some(seat) = seat {
            let mut seat_nft = seat.clone();
            seat_nft.owner = Some(Addr::unchecked(candidate.candidate_hash.clone()));
            SEATS.save(deps.storage, &seat_nft.id, &seat_nft)?;
        }
        
        RESULTS.save(deps.storage, &candidate.candidate_hash, &result)?;
        results.push(result);
    }
    
    Ok(Response::new()
        .add_attribute("action", "run_matching")
        .add_attribute("assigned", results.len().to_string()))
}

#[entry_point]
pub fn query(
    deps: Deps,
    _env: Env,
    msg: QueryMsg
) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetSeatNFT { seat_id } => {
            let seat = SEATS.load(deps.storage, &seat_id)?;
            to_binary(&seat)
        },
        QueryMsg::GetCandidateScore { candidate_hash } => {
            let score = SCORES.load(deps.storage, &candidate_hash)?;
            to_binary(&score)
        },
        QueryMsg::GetAdmissionResult { candidate_hash } => {
            let result = RESULTS.load(deps.storage, &candidate_hash)?;
            to_binary(&result)
        },
        QueryMsg::ListAdmissionResults {} => {
            let mut results: Vec<AdmissionResult> = vec![];
            let result_iter = RESULTS.range(deps.storage, None, None, Order::Ascending);
            for item in result_iter {
                let (_, result) = item?;
                results.push(result);
            }
            to_binary(&results)
        },
    }
}
