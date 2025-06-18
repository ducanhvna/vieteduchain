// Course completion certificate NFT extension
use cosmwasm_std::{Addr, Binary, Uint128};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

// Certificate for course completion
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CourseCompletionCertificate {
    pub certificate_id: String,        // Unique identifier for the certificate
    pub course_id: String,             // ID of the completed course
    pub student: Addr,                 // Student who completed the course
    pub issuer: Addr,                  // School that issued the certificate
    pub issue_date: u64,               // When the certificate was issued
    pub metadata_uri: String,          // URI to the certificate metadata
    pub revoked: bool,                 // Whether the certificate has been revoked
}

// Degree NFT composed of multiple course certificates
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct DegreeNFT {
    pub degree_id: String,             // Unique identifier for the degree
    pub student: Addr,                 // Student who earned the degree
    pub issuer: Addr,                  // School that issued the degree
    pub certificate_ids: Vec<String>,  // IDs of the certificates that make up the degree
    pub degree_type: String,           // Type of degree (Bachelor's, Master's, etc.)
    pub issue_date: u64,               // When the degree was issued
    pub metadata_uri: String,          // URI to the degree metadata
    pub revoked: bool,                 // Whether the degree has been revoked
}

// Course progression tracking
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CourseProgression {
    pub student: Addr,                 // Student being tracked
    pub course_id: String,             // Course being tracked
    pub progress: u8,                  // Progress percentage (0-100)
    pub completed: bool,               // Whether the course has been completed
    pub completion_date: Option<u64>,  // When the course was completed
    pub certificate_id: Option<String>, // ID of the certificate if course is completed
}

// Storage key helpers
pub fn certificate_key(certificate_id: &str) -> Vec<u8> {
    ["certificate:", certificate_id].concat().into_bytes()
}

pub fn degree_key(degree_id: &str) -> Vec<u8> {
    ["degree:", degree_id].concat().into_bytes()
}

pub fn progression_key(student: &Addr, course_id: &str) -> Vec<u8> {
    ["progression:", student.as_str(), ":", course_id].concat().into_bytes()
}

pub fn student_certificates_key(student: &Addr) -> Vec<u8> {
    ["student_certs:", student.as_str()].concat().into_bytes()
}

pub fn student_degrees_key(student: &Addr) -> Vec<u8> {
    ["student_degrees:", student.as_str()].concat().into_bytes()
}

// Operations for certificates and degrees
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum CertificateOperation {
    Issue {
        certificate_id: String,
        course_id: String,
        student: Addr,
        metadata_uri: String,
    },
    Revoke {
        certificate_id: String,
    },
    UpdateProgress {
        student: Addr,
        course_id: String,
        progress: u8,
    },
    MarkCompleted {
        student: Addr,
        course_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum DegreeOperation {
    Issue {
        degree_id: String,
        student: Addr,
        certificate_ids: Vec<String>,
        degree_type: String,
        metadata_uri: String,
    },
    Revoke {
        degree_id: String,
    },
    AddCertificate {
        degree_id: String,
        certificate_id: String,
    },
}

// Execute messages for certificates and degrees
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum CertificateExecuteMsg {
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
}

// Query messages for certificates and degrees
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum CertificateQueryMsg {
    GetCertificate { certificate_id: String },
    GetStudentCertificates { student: String },
    GetCourseProgress { student: String, course_id: String },
    GetDegree { degree_id: String },
    GetStudentDegrees { student: String },
    CheckEligibleForDegree { student: String, degree_type: String },
}

// Response for degree eligibility check
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct DegreeEligibilityResponse {
    pub eligible: bool,
    pub missing_courses: Vec<String>,
    pub completed_courses: Vec<String>,
}

// Degree requirements by type
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct DegreeRequirements {
    pub degree_type: String,
    pub required_courses: Vec<String>,
    pub required_credits: u32,
    pub minimum_gpa: Option<f32>,
}

pub fn requirements_key(degree_type: &str) -> Vec<u8> {
    ["requirements:", degree_type].concat().into_bytes()
}
