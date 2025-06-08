// Minimal contract entry for CosmWasm
use cosmwasm_std::{entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, to_binary, Addr, Uint128, Coin, BankMsg};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// Course NFT (ERC-721 style)
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CourseNFT {
    pub id: String,
    pub creator: Addr,
    pub owner: Addr,
    pub metadata: String, // course info, URI, etc.
    pub price: Uint128,   // eVND price
    pub sold: bool,
}

// InstantiateMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

// ExecuteMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    MintCourseNFT { id: String, metadata: String, price: Uint128 },
    BuyCourseNFT { id: String },
}

// QueryMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetCourseNFT { id: String },
    ListCourseNFTs {},
}

const COURSE_PREFIX: &str = "course:";
const SCHOLARSHIP_FUND: &str = "scholarship_fund";

fn course_key(id: &str) -> Vec<u8> {
    [COURSE_PREFIX.as_bytes(), id.as_bytes()].concat()
}

#[entry_point]
pub fn instantiate(_deps: DepsMut, _env: Env, _info: MessageInfo, _msg: InstantiateMsg) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: Binary) -> StdResult<Response> {
    let exec_msg: ExecuteMsg = cosmwasm_std::from_binary(&msg)?;
    match exec_msg {
        ExecuteMsg::MintCourseNFT { id, metadata, price } => mint_course_nft(deps, info, id, metadata, price),
        ExecuteMsg::BuyCourseNFT { id } => buy_course_nft(deps, env, info, id),
    }
}

fn mint_course_nft(deps: DepsMut, info: MessageInfo, id: String, metadata: String, price: Uint128) -> StdResult<Response> {
    let key = course_key(&id);
    if deps.storage.get(&key).is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Course already exists"));
    }
    let nft = CourseNFT {
        id: id.clone(),
        creator: info.sender.clone(),
        owner: info.sender.clone(),
        metadata,
        price,
        sold: false,
    };
    deps.storage.set(&key, &to_binary(&nft)?);
    Ok(Response::new().add_attribute("action", "mint_course_nft").add_attribute("id", id))
}

fn buy_course_nft(deps: DepsMut, env: Env, info: MessageInfo, id: String) -> StdResult<Response> {
    let key = course_key(&id);
    let mut nft: CourseNFT = cosmwasm_std::from_binary(&deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("CourseNFT"))?)?;
    if nft.sold {
        return Err(cosmwasm_std::StdError::generic_err("Course already sold"));
    }
    // Check payment
    let sent = info.funds.iter().find(|c| c.denom == "evnd").map(|c| c.amount).unwrap_or(Uint128::zero());
    if sent < nft.price {
        return Err(cosmwasm_std::StdError::generic_err("Insufficient payment"));
    }
    // Calculate fee (2%)
    let fee = nft.price.multiply_ratio(2u128, 100u128);
    let payout = nft.price.checked_sub(fee)?;
    // Transfer payout to creator, fee to scholarship fund
    let msgs = vec![
        BankMsg::Send {
            to_address: nft.creator.to_string(),
            amount: vec![Coin { denom: "evnd".to_string(), amount: payout }],
        },
        BankMsg::Send {
            to_address: SCHOLARSHIP_FUND.to_string(),
            amount: vec![Coin { denom: "evnd".to_string(), amount: fee }],
        },
    ];
    nft.owner = info.sender.clone();
    nft.sold = true;
    deps.storage.set(&key, &to_binary(&nft)?);
    Ok(Response::new().add_messages(msgs).add_attribute("action", "buy_course_nft").add_attribute("id", id))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: Binary) -> StdResult<Binary> {
    let query_msg: QueryMsg = cosmwasm_std::from_binary(&msg)?;
    match query_msg {
        QueryMsg::GetCourseNFT { id } => {
            let key = course_key(&id);
            let nft = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("CourseNFT"))?;
            Ok(Binary(nft))
        },
        QueryMsg::ListCourseNFTs {} => {
            use cosmwasm_std::Order;
            let mut nfts: Vec<CourseNFT> = vec![];
            let prefix = COURSE_PREFIX.as_bytes();
            let iter = deps.storage.range(Some(prefix), None, Order::Ascending);
            for item in iter {
                if let Ok((_, v)) = item {
                    if let Ok(nft) = cosmwasm_std::from_binary::<CourseNFT>(&v) {
                        nfts.push(nft);
                    }
                }
            }
            Ok(to_binary(&nfts)?)
        },
    }
}
