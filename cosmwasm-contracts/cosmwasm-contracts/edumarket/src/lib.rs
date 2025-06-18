// Minimal contract entry for CosmWasm
use cosmwasm_std::{entry_point, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Binary, to_binary, from_binary, Addr, Uint128, Coin, BankMsg, Order};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// Import certificate extension
mod certificates;
use certificates::{CourseCompletionCertificate, DegreeNFT, CourseProgression, DegreeRequirements, DegreeEligibilityResponse};
use certificates::{certificate_key, degree_key, progression_key, student_certificates_key, student_degrees_key, requirements_key};

// Course NFT (ERC-721 style)
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CourseNFT {
    pub id: String,
    pub creator: Addr,
    pub owner: Addr,
    pub metadata: String, // course info, URI, etc.
    pub price: Uint128,   // eVND price
    pub sold: bool,
    pub completed_by: Vec<Addr>, // Students who have completed this course
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
    // Certificate related operations
    IssueCertificate {
        certificate_id: String,
        course_id: String,
        student: String,
        metadata_uri: String,
    },
    RevokeCertificate {
        certificate_id: String,
    },
    UpdateCourseProgress {
        student: String,
        course_id: String,
        progress: u8,
    },
    CompleteCourse {
        student: String,
        course_id: String,
    },
    // Degree related operations
    IssueDegree {
        degree_id: String,
        student: String,
        certificate_ids: Vec<String>,
        degree_type: String,
        metadata_uri: String,
    },
    RevokeDegree {
        degree_id: String,
    },
    AddCertificateToDegree {
        degree_id: String,
        certificate_id: String,
    },
    // Degree requirements
    SetDegreeRequirements {
        degree_type: String,
        required_courses: Vec<String>,
        required_credits: u32,
        minimum_gpa: Option<f32>,
    },
}

// QueryMsg
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetCourseNFT { id: String },
    ListCourseNFTs {},
    // Certificate related queries
    GetCertificate { certificate_id: String },
    GetStudentCertificates { student: String },
    GetCourseProgress { student: String, course_id: String },
    // Degree related queries
    GetDegree { degree_id: String },
    GetStudentDegrees { student: String },
    CheckEligibleForDegree { student: String, degree_type: String },
    GetDegreeRequirements { degree_type: String },
}

const COURSE_PREFIX: &str = "course:";
const CERTIFICATE_PREFIX: &str = "certificate:";
const DEGREE_PREFIX: &str = "degree:";
const PROGRESSION_PREFIX: &str = "progression:";
const REQUIREMENTS_PREFIX: &str = "requirements:";
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
    let exec_msg: ExecuteMsg = from_binary(&msg)?;
    match exec_msg {
        ExecuteMsg::MintCourseNFT { id, metadata, price } => mint_course_nft(deps, info, id, metadata, price),
        ExecuteMsg::BuyCourseNFT { id } => buy_course_nft(deps, env, info, id),
        // Certificate operations
        ExecuteMsg::IssueCertificate { certificate_id, course_id, student, metadata_uri } => 
            issue_certificate(deps, env, info, certificate_id, course_id, student, metadata_uri),
        ExecuteMsg::RevokeCertificate { certificate_id } => 
            revoke_certificate(deps, env, info, certificate_id),
        ExecuteMsg::UpdateCourseProgress { student, course_id, progress } => 
            update_course_progress(deps, env, info, student, course_id, progress),
        ExecuteMsg::CompleteCourse { student, course_id } => 
            complete_course(deps, env, info, student, course_id),
        // Degree operations
        ExecuteMsg::IssueDegree { degree_id, student, certificate_ids, degree_type, metadata_uri } => 
            issue_degree(deps, env, info, degree_id, student, certificate_ids, degree_type, metadata_uri),
        ExecuteMsg::RevokeDegree { degree_id } => 
            revoke_degree(deps, env, info, degree_id),
        ExecuteMsg::AddCertificateToDegree { degree_id, certificate_id } => 
            add_certificate_to_degree(deps, env, info, degree_id, certificate_id),
        // Degree requirements
        ExecuteMsg::SetDegreeRequirements { degree_type, required_courses, required_credits, minimum_gpa } => 
            set_degree_requirements(deps, env, info, degree_type, required_courses, required_credits, minimum_gpa),
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
        completed_by: Vec::new(),
    };
    deps.storage.set(&key, &to_binary(&nft)?);
    Ok(Response::new().add_attribute("action", "mint_course_nft").add_attribute("id", id))
}

fn buy_course_nft(deps: DepsMut, env: Env, info: MessageInfo, id: String) -> StdResult<Response> {
    let key = course_key(&id);
    let mut nft: CourseNFT = from_binary(&deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("CourseNFT"))?)?;
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
    
    // Initialize course progression
    let progression = CourseProgression {
        student: info.sender.clone(),
        course_id: id.clone(),
        progress: 0,
        completed: false,
        completion_date: None,
        certificate_id: None,
    };
    deps.storage.set(&progression_key(&info.sender, &id), &to_binary(&progression)?);
    
    Ok(Response::new().add_messages(msgs).add_attribute("action", "buy_course_nft").add_attribute("id", id))
}

// Certificate operations
fn issue_certificate(
    deps: DepsMut, 
    env: Env, 
    info: MessageInfo, 
    certificate_id: String, 
    course_id: String, 
    student: String,
    metadata_uri: String
) -> StdResult<Response> {
    // Check if certificate already exists
    let cert_key = certificate_key(&certificate_id);
    if deps.storage.get(&cert_key).is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Certificate already exists"));
    }
    
    // Validate student address
    let student_addr = deps.api.addr_validate(&student)?;
    
    // Check if course exists and sender is the creator
    let course_key = course_key(&course_id);
    let course: CourseNFT = from_binary(&deps.storage.get(&course_key).ok_or(cosmwasm_std::StdError::not_found("CourseNFT"))?)?;
    if course.creator != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Only course creator can issue certificates"));
    }
    
    // Check if student has completed the course
    let progression_key = progression_key(&student_addr, &course_id);
    let progression_bin = deps.storage.get(&progression_key);
    if progression_bin.is_none() {
        return Err(cosmwasm_std::StdError::generic_err("Student has not enrolled in this course"));
    }
    
    let mut progression: CourseProgression = from_binary(&progression_bin.unwrap())?;
    if !progression.completed {
        return Err(cosmwasm_std::StdError::generic_err("Student has not completed this course"));
    }
    
    // Create certificate
    let certificate = CourseCompletionCertificate {
        certificate_id: certificate_id.clone(),
        course_id: course_id.clone(),
        student: student_addr.clone(),
        issuer: info.sender.clone(),
        issue_date: env.block.time.seconds(),
        metadata_uri,
        revoked: false,
    };
    
    // Store certificate
    deps.storage.set(&cert_key, &to_binary(&certificate)?);
    
    // Update course progression with certificate id
    progression.certificate_id = Some(certificate_id.clone());
    deps.storage.set(&progression_key, &to_binary(&progression)?);
    
    // Add to student's certificates
    let student_certs_key = student_certificates_key(&student_addr);
    let mut student_certs: Vec<String> = deps.storage.get(&student_certs_key)
        .map(|bin| from_binary(&bin).unwrap_or_default())
        .unwrap_or_default();
    student_certs.push(certificate_id.clone());
    deps.storage.set(&student_certs_key, &to_binary(&student_certs)?);
    
    // Add student to course's completed_by list if not already there
    let mut course = course;
    if !course.completed_by.contains(&student_addr) {
        course.completed_by.push(student_addr.clone());
        deps.storage.set(&course_key, &to_binary(&course)?);
    }
    
    Ok(Response::new()
        .add_attribute("action", "issue_certificate")
        .add_attribute("certificate_id", certificate_id)
        .add_attribute("course_id", course_id)
        .add_attribute("student", student))
}

fn revoke_certificate(
    deps: DepsMut, 
    _env: Env, 
    info: MessageInfo, 
    certificate_id: String
) -> StdResult<Response> {
    // Get certificate
    let cert_key = certificate_key(&certificate_id);
    let cert_bin = deps.storage.get(&cert_key).ok_or(cosmwasm_std::StdError::not_found("Certificate"))?;
    let mut certificate: CourseCompletionCertificate = from_binary(&cert_bin)?;
    
    // Check if sender is the issuer
    if certificate.issuer != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Only issuer can revoke certificate"));
    }
    
    // Revoke certificate
    certificate.revoked = true;
    deps.storage.set(&cert_key, &to_binary(&certificate)?);
    
    Ok(Response::new()
        .add_attribute("action", "revoke_certificate")
        .add_attribute("certificate_id", certificate_id))
}

fn update_course_progress(
    deps: DepsMut, 
    _env: Env, 
    info: MessageInfo, 
    student: String, 
    course_id: String,
    progress: u8
) -> StdResult<Response> {
    // Validate student address
    let student_addr = deps.api.addr_validate(&student)?;
    
    // Check if course exists and sender is the creator
    let course_key = course_key(&course_id);
    let course: CourseNFT = from_binary(&deps.storage.get(&course_key).ok_or(cosmwasm_std::StdError::not_found("CourseNFT"))?)?;
    if course.creator != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Only course creator can update progress"));
    }
    
    // Check if progress is valid (0-100)
    if progress > 100 {
        return Err(cosmwasm_std::StdError::generic_err("Progress must be between 0 and 100"));
    }
    
    // Get or create progression
    let prog_key = progression_key(&student_addr, &course_id);
    let mut progression = deps.storage.get(&prog_key)
        .map(|bin| from_binary::<CourseProgression>(&bin).unwrap())
        .unwrap_or(CourseProgression {
            student: student_addr.clone(),
            course_id: course_id.clone(),
            progress: 0,
            completed: false,
            completion_date: None,
            certificate_id: None,
        });
    
    // Update progress
    progression.progress = progress;
    
    // Auto-complete course if progress is 100%
    if progress == 100 && !progression.completed {
        progression.completed = true;
        progression.completion_date = Some(_env.block.time.seconds());
    }
    
    // Store updated progression
    deps.storage.set(&prog_key, &to_binary(&progression)?);
    
    Ok(Response::new()
        .add_attribute("action", "update_course_progress")
        .add_attribute("student", student)
        .add_attribute("course_id", course_id)
        .add_attribute("progress", progress.to_string()))
}

fn complete_course(
    deps: DepsMut, 
    env: Env, 
    info: MessageInfo, 
    student: String, 
    course_id: String
) -> StdResult<Response> {
    // Validate student address
    let student_addr = deps.api.addr_validate(&student)?;
    
    // Check if course exists and sender is the creator
    let course_key = course_key(&course_id);
    let course: CourseNFT = from_binary(&deps.storage.get(&course_key).ok_or(cosmwasm_std::StdError::not_found("CourseNFT"))?)?;
    if course.creator != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Only course creator can mark completion"));
    }
    
    // Get progression
    let prog_key = progression_key(&student_addr, &course_id);
    let mut progression = deps.storage.get(&prog_key)
        .map(|bin| from_binary::<CourseProgression>(&bin).unwrap())
        .unwrap_or(CourseProgression {
            student: student_addr.clone(),
            course_id: course_id.clone(),
            progress: 0,
            completed: false,
            completion_date: None,
            certificate_id: None,
        });
    
    // Mark as completed
    progression.completed = true;
    progression.completion_date = Some(env.block.time.seconds());
    progression.progress = 100; // Set progress to 100%
    
    // Store updated progression
    deps.storage.set(&prog_key, &to_binary(&progression)?);
    
    // Add student to course's completed_by list if not already there
    let mut course = course;
    if !course.completed_by.contains(&student_addr) {
        course.completed_by.push(student_addr.clone());
        deps.storage.set(&course_key, &to_binary(&course)?);
    }
    
    Ok(Response::new()
        .add_attribute("action", "complete_course")
        .add_attribute("student", student)
        .add_attribute("course_id", course_id))
}

// Degree operations
fn issue_degree(
    deps: DepsMut, 
    env: Env, 
    info: MessageInfo, 
    degree_id: String, 
    student: String,
    certificate_ids: Vec<String>,
    degree_type: String,
    metadata_uri: String
) -> StdResult<Response> {
    // Check if degree already exists
    let degree_key = degree_key(&degree_id);
    if deps.storage.get(&degree_key).is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Degree already exists"));
    }
    
    // Validate student address
    let student_addr = deps.api.addr_validate(&student)?;
    
    // Verify all certificates exist, are valid, and belong to the student
    for cert_id in &certificate_ids {
        let cert_key = certificate_key(cert_id);
        let cert_bin = deps.storage.get(&cert_key).ok_or(cosmwasm_std::StdError::not_found("Certificate"))?;
        let certificate: CourseCompletionCertificate = from_binary(&cert_bin)?;
        
        if certificate.student != student_addr {
            return Err(cosmwasm_std::StdError::generic_err("Certificate does not belong to student"));
        }
        
        if certificate.revoked {
            return Err(cosmwasm_std::StdError::generic_err("Cannot use revoked certificate"));
        }
    }
    
    // Check degree requirements
    let req_key = requirements_key(&degree_type);
    if let Some(req_bin) = deps.storage.get(&req_key) {
        let requirements: DegreeRequirements = from_binary(&req_bin)?;
        
        // Get all course IDs from certificates
        let mut course_ids = Vec::new();
        for cert_id in &certificate_ids {
            let cert_key = certificate_key(cert_id);
            let cert: CourseCompletionCertificate = from_binary(&deps.storage.get(&cert_key).unwrap())?;
            course_ids.push(cert.course_id);
        }
        
        // Check if all required courses are included
        for required_course in &requirements.required_courses {
            if !course_ids.contains(required_course) {
                return Err(cosmwasm_std::StdError::generic_err(format!(
                    "Missing required course for {}: {}", degree_type, required_course
                )));
            }
        }
    }
    
    // Create degree
    let degree = DegreeNFT {
        degree_id: degree_id.clone(),
        student: student_addr.clone(),
        issuer: info.sender.clone(),
        certificate_ids: certificate_ids.clone(),
        degree_type,
        issue_date: env.block.time.seconds(),
        metadata_uri,
        revoked: false,
    };
    
    // Store degree
    deps.storage.set(&degree_key, &to_binary(&degree)?);
    
    // Add to student's degrees
    let student_degrees_key = student_degrees_key(&student_addr);
    let mut student_degrees: Vec<String> = deps.storage.get(&student_degrees_key)
        .map(|bin| from_binary(&bin).unwrap_or_default())
        .unwrap_or_default();
    student_degrees.push(degree_id.clone());
    deps.storage.set(&student_degrees_key, &to_binary(&student_degrees)?);
    
    Ok(Response::new()
        .add_attribute("action", "issue_degree")
        .add_attribute("degree_id", degree_id)
        .add_attribute("student", student)
        .add_attribute("certificate_count", certificate_ids.len().to_string()))
}

fn revoke_degree(
    deps: DepsMut, 
    _env: Env, 
    info: MessageInfo, 
    degree_id: String
) -> StdResult<Response> {
    // Get degree
    let degree_key = degree_key(&degree_id);
    let degree_bin = deps.storage.get(&degree_key).ok_or(cosmwasm_std::StdError::not_found("Degree"))?;
    let mut degree: DegreeNFT = from_binary(&degree_bin)?;
    
    // Check if sender is the issuer
    if degree.issuer != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Only issuer can revoke degree"));
    }
    
    // Revoke degree
    degree.revoked = true;
    deps.storage.set(&degree_key, &to_binary(&degree)?);
    
    Ok(Response::new()
        .add_attribute("action", "revoke_degree")
        .add_attribute("degree_id", degree_id))
}

fn add_certificate_to_degree(
    deps: DepsMut, 
    _env: Env, 
    info: MessageInfo, 
    degree_id: String,
    certificate_id: String
) -> StdResult<Response> {
    // Get degree
    let degree_key = degree_key(&degree_id);
    let degree_bin = deps.storage.get(&degree_key).ok_or(cosmwasm_std::StdError::not_found("Degree"))?;
    let mut degree: DegreeNFT = from_binary(&degree_bin)?;
    
    // Check if sender is the issuer
    if degree.issuer != info.sender {
        return Err(cosmwasm_std::StdError::generic_err("Only issuer can add certificates to degree"));
    }
    
    // Get certificate
    let cert_key = certificate_key(&certificate_id);
    let cert_bin = deps.storage.get(&cert_key).ok_or(cosmwasm_std::StdError::not_found("Certificate"))?;
    let certificate: CourseCompletionCertificate = from_binary(&cert_bin)?;
    
    // Check if certificate belongs to the degree owner
    if certificate.student != degree.student {
        return Err(cosmwasm_std::StdError::generic_err("Certificate does not belong to degree owner"));
    }
    
    // Add certificate to degree if not already added
    if !degree.certificate_ids.contains(&certificate_id) {
        degree.certificate_ids.push(certificate_id.clone());
        deps.storage.set(&degree_key, &to_binary(&degree)?);
    }
    
    Ok(Response::new()
        .add_attribute("action", "add_certificate_to_degree")
        .add_attribute("degree_id", degree_id)
        .add_attribute("certificate_id", certificate_id))
}

fn set_degree_requirements(
    deps: DepsMut, 
    _env: Env, 
    info: MessageInfo, 
    degree_type: String,
    required_courses: Vec<String>,
    required_credits: u32,
    minimum_gpa: Option<f32>
) -> StdResult<Response> {
    // Create requirements
    let requirements = DegreeRequirements {
        degree_type: degree_type.clone(),
        required_courses,
        required_credits,
        minimum_gpa,
    };
    
    // Store requirements
    let key = requirements_key(&degree_type);
    deps.storage.set(&key, &to_binary(&requirements)?);
    
    Ok(Response::new()
        .add_attribute("action", "set_degree_requirements")
        .add_attribute("degree_type", degree_type))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: Binary) -> StdResult<Binary> {
    let query_msg: QueryMsg = from_binary(&msg)?;
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
                    if let Ok(nft) = from_binary::<CourseNFT>(&v) {
                        nfts.push(nft);
                    }
                }
            }
            to_binary(&nfts)
        },
        // Certificate queries
        QueryMsg::GetCertificate { certificate_id } => {
            let key = certificate_key(&certificate_id);
            let cert = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("Certificate"))?;
            Ok(Binary(cert))
        },
        QueryMsg::GetStudentCertificates { student } => {
            let student_addr = deps.api.addr_validate(&student)?;
            let key = student_certificates_key(&student_addr);
            
            let cert_ids: Vec<String> = deps.storage.get(&key)
                .map(|bin| from_binary(&bin).unwrap_or_default())
                .unwrap_or_default();
            
            let mut certificates = Vec::new();
            for cert_id in cert_ids {
                let cert_key = certificate_key(&cert_id);
                if let Some(cert_bin) = deps.storage.get(&cert_key) {
                    let certificate: CourseCompletionCertificate = from_binary(&cert_bin)?;
                    certificates.push(certificate);
                }
            }
            
            to_binary(&certificates)
        },
        QueryMsg::GetCourseProgress { student, course_id } => {
            let student_addr = deps.api.addr_validate(&student)?;
            let key = progression_key(&student_addr, &course_id);
            
            let progression = deps.storage.get(&key)
                .map(|bin| from_binary::<CourseProgression>(&bin).unwrap())
                .unwrap_or(CourseProgression {
                    student: student_addr,
                    course_id,
                    progress: 0,
                    completed: false,
                    completion_date: None,
                    certificate_id: None,
                });
            
            to_binary(&progression)
        },
        // Degree queries
        QueryMsg::GetDegree { degree_id } => {
            let key = degree_key(&degree_id);
            let degree = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("Degree"))?;
            Ok(Binary(degree))
        },
        QueryMsg::GetStudentDegrees { student } => {
            let student_addr = deps.api.addr_validate(&student)?;
            let key = student_degrees_key(&student_addr);
            
            let degree_ids: Vec<String> = deps.storage.get(&key)
                .map(|bin| from_binary(&bin).unwrap_or_default())
                .unwrap_or_default();
            
            let mut degrees = Vec::new();
            for degree_id in degree_ids {
                let degree_key = degree_key(&degree_id);
                if let Some(degree_bin) = deps.storage.get(&degree_key) {
                    let degree: DegreeNFT = from_binary(&degree_bin)?;
                    degrees.push(degree);
                }
            }
            
            to_binary(&degrees)
        },
        QueryMsg::CheckEligibleForDegree { student, degree_type } => {
            check_degree_eligibility(deps, student, degree_type)
        },
        QueryMsg::GetDegreeRequirements { degree_type } => {
            let key = requirements_key(&degree_type);
            let requirements = deps.storage.get(&key).ok_or(cosmwasm_std::StdError::not_found("DegreeRequirements"))?;
            Ok(Binary(requirements))
        },
    }
}

fn check_degree_eligibility(deps: Deps, student: String, degree_type: String) -> StdResult<Binary> {
    // Validate student address
    let student_addr = deps.api.addr_validate(&student)?;
    
    // Get degree requirements
    let req_key = requirements_key(&degree_type);
    let requirements: DegreeRequirements = deps.storage.get(&req_key)
        .map(|bin| from_binary(&bin).unwrap())
        .unwrap_or(DegreeRequirements {
            degree_type: degree_type.clone(),
            required_courses: vec![],
            required_credits: 0,
            minimum_gpa: None,
        });
    
    // Get student certificates
    let student_certs_key = student_certificates_key(&student_addr);
    let cert_ids: Vec<String> = deps.storage.get(&student_certs_key)
        .map(|bin| from_binary(&bin).unwrap_or_default())
        .unwrap_or_default();
    
    // Get course IDs from certificates
    let mut completed_courses = Vec::new();
    for cert_id in cert_ids {
        let cert_key = certificate_key(&cert_id);
        if let Some(cert_bin) = deps.storage.get(&cert_key) {
            let certificate: CourseCompletionCertificate = from_binary(&cert_bin)?;
            if !certificate.revoked {
                completed_courses.push(certificate.course_id);
            }
        }
    }
    
    // Check which required courses are missing
    let mut missing_courses = Vec::new();
    for required_course in &requirements.required_courses {
        if !completed_courses.contains(required_course) {
            missing_courses.push(required_course.clone());
        }
    }
    
    // Determine eligibility
    let eligible = missing_courses.is_empty();
    
    // Create response
    let response = DegreeEligibilityResponse {
        eligible,
        missing_courses,
        completed_courses,
    };
    
    to_binary(&response)
}
