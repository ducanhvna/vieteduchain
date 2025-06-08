// Minimal contract entry for CosmWasm
use cosmwasm_std::{entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, to_binary, QueryRequest};
use serde::{Serialize, Deserialize};
use cosmwasm_schema::QueryResponses;
use cosmwasm_std::Addr;

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

const SEAT_PREFIX: &str = "seat:";
const SCORE_PREFIX: &str = "score:";
const RESULT_PREFIX: &str = "result:";

fn seat_key(id: &str) -> Vec<u8> {
    [SEAT_PREFIX.as_bytes(), id.as_bytes()].concat()
}
fn score_key(hash: &str) -> Vec<u8> {
    [SCORE_PREFIX.as_bytes(), hash.as_bytes()].concat()
}
fn result_key(hash: &str) -> Vec<u8> {
    [RESULT_PREFIX.as_bytes(), hash.as_bytes()].concat()
}

#[entry_point]
pub fn instantiate(_deps: DepsMut, _env: Env, _info: MessageInfo, _msg: InstantiateMsg) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: Binary) -> StdResult<Response> {
    let exec_msg: ExecuteMsg = cosmwasm_std::from_binary(&msg)?;
    match exec_msg {
        ExecuteMsg::MintSeatNFT { seat_id } => mint_seat_nft(deps, info, seat_id),
        ExecuteMsg::BurnSeatNFT { seat_id } => burn_seat_nft(deps, info, seat_id),
        ExecuteMsg::PushScore { candidate_hash, score } => push_score(deps, info, candidate_hash, score),
        ExecuteMsg::RunMatching {} => run_matching(deps, env),
    }
}

fn mint_seat_nft(deps: DepsMut, info: MessageInfo, seat_id: String) -> StdResult<Response> {
    let key = seat_key(&seat_id);
    if deps.storage.get(&key).is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Seat already exists"));
    }
    let seat = SeatNFT { id: seat_id.clone(), owner: None, burned: false };
    deps.storage.set(&key, &to_binary(&seat)?);
    Ok(Response::new().add_attribute("action", "mint_seat_nft").add_attribute("seat_id", seat_id))
}

fn burn_seat_nft(deps: DepsMut, info: MessageInfo, seat_id: String) -> StdResult<Response> {
    let key = seat_key(&seat_id);
    let mut seat: SeatNFT = cosmwasm_std::from_binary(&deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("SeatNFT"))?)?;
    if seat.burned {
        return Err(cosmwasm_std::StdError::generic_err("Seat already burned"));
    }
    seat.burned = true;
    seat.owner = None;
    deps.storage.set(&key, &to_binary(&seat)?);
    Ok(Response::new().add_attribute("action", "burn_seat_nft").add_attribute("seat_id", seat_id))
}

fn push_score(deps: DepsMut, info: MessageInfo, candidate_hash: String, score: u32) -> StdResult<Response> {
    let key = score_key(&candidate_hash);
    let score_rec = CandidateScore { candidate_hash: candidate_hash.clone(), score };
    deps.storage.set(&key, &to_binary(&score_rec)?);
    Ok(Response::new().add_attribute("action", "push_score").add_attribute("candidate_hash", candidate_hash))
}

fn run_matching(deps: DepsMut, env: Env) -> StdResult<Response> {
    // Simple matching: assign top scores to available seats
    use cosmwasm_std::Order;
    let mut scores: Vec<CandidateScore> = vec![];
    let mut seats: Vec<SeatNFT> = vec![];
    let mut results: Vec<AdmissionResult> = vec![];
    let score_prefix = SCORE_PREFIX.as_bytes();
    let seat_prefix = SEAT_PREFIX.as_bytes();
    let result_prefix = RESULT_PREFIX.as_bytes();
    // Collect all scores
    let score_iter = deps.storage.range(Some(score_prefix), None, Order::Ascending);
    for item in score_iter {
        if let Ok((_, v)) = item {
            if let Ok(s) = cosmwasm_std::from_binary::<CandidateScore>(&v) {
                scores.push(s);
            }
        }
    }
    // Collect all available seats
    let seat_iter = deps.storage.range(Some(seat_prefix), None, Order::Ascending);
    for item in seat_iter {
        if let Ok((_, v)) = item {
            if let Ok(seat) = cosmwasm_std::from_binary::<SeatNFT>(&v) {
                if !seat.burned && seat.owner.is_none() {
                    seats.push(seat);
                }
            }
        }
    }
    // Sort scores descending
    scores.sort_by(|a, b| b.score.cmp(&a.score));
    // Assign seats
    for (i, candidate) in scores.iter().enumerate() {
        let seat = seats.get(i);
        let mut result = AdmissionResult {
            candidate_hash: candidate.candidate_hash.clone(),
            seat_id: seat.map(|s| s.id.clone()),
            admitted: seat.is_some(),
            score: candidate.score,
        };
        // Update seat owner if assigned
        if let Some(seat) = seat {
            let mut seat_nft = seat.clone();
            seat_nft.owner = Some(Addr::unchecked(candidate.candidate_hash.clone()));
            let seat_key = seat_key(&seat_nft.id);
            deps.storage.set(&seat_key, &to_binary(&seat_nft)?);
        }
        let result_key = result_key(&candidate.candidate_hash);
        deps.storage.set(&result_key, &to_binary(&result)?);
        results.push(result);
    }
    Ok(Response::new().add_attribute("action", "run_matching").add_attribute("assigned", results.len().to_string()))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: Binary) -> StdResult<Binary> {
    let query_msg: QueryMsg = cosmwasm_std::from_binary(&msg)?;
    match query_msg {
        QueryMsg::GetSeatNFT { seat_id } => {
            let key = seat_key(&seat_id);
            let seat = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("SeatNFT"))?;
            Ok(Binary(seat))
        },
        QueryMsg::GetCandidateScore { candidate_hash } => {
            let key = score_key(&candidate_hash);
            let score = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("CandidateScore"))?;
            Ok(Binary(score))
        },
        QueryMsg::GetAdmissionResult { candidate_hash } => {
            let key = result_key(&candidate_hash);
            let result = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("AdmissionResult"))?;
            Ok(Binary(result))
        },
        QueryMsg::ListAdmissionResults {} => {
            use cosmwasm_std::Order;
            let mut results: Vec<AdmissionResult> = vec![];
            let result_prefix = RESULT_PREFIX.as_bytes();
            let result_iter = deps.storage.range(Some(result_prefix), None, Order::Ascending);
            for item in result_iter {
                if let Ok((_, v)) = item {
                    if let Ok(r) = cosmwasm_std::from_binary::<AdmissionResult>(&v) {
                        results.push(r);
                    }
                }
            }
            Ok(to_binary(&results)?)
        },
    }
}
