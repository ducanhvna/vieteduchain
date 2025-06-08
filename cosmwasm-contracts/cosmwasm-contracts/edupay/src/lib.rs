// Minimal contract entry for CosmWasm
use cosmwasm_std::{entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, to_binary, Addr, Coin, BankMsg, WasmMsg, Uint128};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// Escrow state
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Escrow {
    pub payer: Addr,
    pub school: Addr,
    pub amount: Uint128,
    pub denom: String,
    pub released: bool,
    pub proof_of_enrollment: bool,
}

// InstantiateMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

// ExecuteMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    CreateEscrow { school: String, amount: Uint128, denom: String },
    SetProofOfEnrollment { escrow_id: String },
    Release { escrow_id: String },
}

// QueryMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetEscrow { escrow_id: String },
}

const ESCROW_PREFIX: &str = "escrow:";

fn escrow_key(id: &str) -> Vec<u8> {
    [ESCROW_PREFIX.as_bytes(), id.as_bytes()].concat()
}

#[entry_point]
pub fn instantiate(_deps: DepsMut, _env: Env, _info: MessageInfo, _msg: InstantiateMsg) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: Binary) -> StdResult<Response> {
    let exec_msg: ExecuteMsg = cosmwasm_std::from_binary(&msg)?;
    match exec_msg {
        ExecuteMsg::CreateEscrow { school, amount, denom } => create_escrow(deps, env, info, school, amount, denom),
        ExecuteMsg::SetProofOfEnrollment { escrow_id } => set_proof_of_enrollment(deps, info, escrow_id),
        ExecuteMsg::Release { escrow_id } => release(deps, env, info, escrow_id),
    }
}

fn create_escrow(deps: DepsMut, env: Env, info: MessageInfo, school: String, amount: Uint128, denom: String) -> StdResult<Response> {
    let escrow_id = format!("{}-{}-{}", info.sender, school, env.block.time.seconds());
    let key = escrow_key(&escrow_id);
    if deps.storage.get(&key).is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Escrow already exists"));
    }
    // Check funds sent
    let sent = info.funds.iter().find(|c| c.denom == denom).map(|c| c.amount).unwrap_or(Uint128::zero());
    if sent < amount {
        return Err(cosmwasm_std::StdError::generic_err("Insufficient funds sent"));
    }
    let escrow = Escrow {
        payer: info.sender.clone(),
        school: deps.api.addr_validate(&school)?,
        amount,
        denom: denom.clone(),
        released: false,
        proof_of_enrollment: false,
    };
    deps.storage.set(&key, &to_binary(&escrow)?);
    Ok(Response::new().add_attribute("action", "create_escrow").add_attribute("escrow_id", escrow_id))
}

fn set_proof_of_enrollment(deps: DepsMut, info: MessageInfo, escrow_id: String) -> StdResult<Response> {
    let key = escrow_key(&escrow_id);
    let mut escrow: Escrow = cosmwasm_std::from_binary(&deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("Escrow"))?)?;
    if info.sender != escrow.school {
        return Err(cosmwasm_std::StdError::generic_err("Only school can set proof of enrollment"));
    }
    escrow.proof_of_enrollment = true;
    deps.storage.set(&key, &to_binary(&escrow)?);
    Ok(Response::new().add_attribute("action", "set_proof_of_enrollment").add_attribute("escrow_id", escrow_id))
}

fn release(deps: DepsMut, env: Env, info: MessageInfo, escrow_id: String) -> StdResult<Response> {
    let key = escrow_key(&escrow_id);
    let mut escrow: Escrow = cosmwasm_std::from_binary(&deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("Escrow"))?)?;
    if escrow.released {
        return Err(cosmwasm_std::StdError::generic_err("Escrow already released"));
    }
    if !escrow.proof_of_enrollment {
        return Err(cosmwasm_std::StdError::generic_err("Proof of enrollment not set"));
    }
    if info.sender != escrow.payer && info.sender != escrow.school {
        return Err(cosmwasm_std::StdError::generic_err("Only payer or school can release"));
    }
    escrow.released = true;
    deps.storage.set(&key, &to_binary(&escrow)?);
    // Send funds to school
    let send = BankMsg::Send {
        to_address: escrow.school.to_string(),
        amount: vec![Coin { denom: escrow.denom.clone(), amount: escrow.amount }],
    };
    Ok(Response::new().add_message(send).add_attribute("action", "release").add_attribute("escrow_id", escrow_id))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: Binary) -> StdResult<Binary> {
    let query_msg: QueryMsg = cosmwasm_std::from_binary(&msg)?;
    match query_msg {
        QueryMsg::GetEscrow { escrow_id } => {
            let key = escrow_key(&escrow_id);
            let escrow = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("Escrow"))?;
            Ok(Binary(escrow))
        }
    }
}
