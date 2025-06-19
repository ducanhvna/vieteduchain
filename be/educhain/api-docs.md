# API DOCUMENTATION

## API Cosmos Core

### Thông tin Tài khoản

```http
GET /cosmos/auth/v1beta1/accounts/{address}
```

**Phản hồi:**

```json
{
  "account": {
    "@type": "/cosmos.auth.v1beta1.BaseAccount",
    "address": "cosmos1abcdefghijklmnopqrstuvwxyz",
    "pub_key": {
      "@type": "/cosmos.crypto.secp256k1.PubKey",
      "key": "Aibxa76Rg3VPVMwL1XvA9TiGmepjMyWdYxv1s4UKYu/e"
    },
    "account_number": "42",
    "sequence": "27"
  }
}
```

### Số dư Tài khoản

```http
GET /cosmos/bank/v1beta1/balances/{address}
```

**Phản hồi:**

```json
{
  "balances": [
    {
      "denom": "stake",
      "amount": "100000000"
    },
    {
      "denom": "evnd",
      "amount": "5000000"
    }
  ],
  "pagination": {
    "next_key": null,
    "total": "2"
  }
}
```

### Gửi Token

```http
POST /cosmos/bank/v1beta1/msgSend
```

**Body:**

```json
{
  "base_req": {
    "from": "sender_address",
    "chain_id": "educhain-1"
  },
  "amount": [
    {
      "denom": "stake",
      "amount": "1000"
    }
  ],
  "to_address": "recipient_address"
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "codespace": "",
  "code": 0,
  "data": "0A060A0473656E64",
  "raw_log": "[{\"events\":[{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"send\"},{\"key\":\"sender\",\"value\":\"sender_address\"},{\"key\":\"module\",\"value\":\"bank\"}]},{\"type\":\"transfer\",\"attributes\":[{\"key\":\"recipient\",\"value\":\"recipient_address\"},{\"key\":\"sender\",\"value\":\"sender_address\"},{\"key\":\"amount\",\"value\":\"1000stake\"}]}]}]",
  "logs": [
    {
      "msg_index": 0,
      "log": "",
      "events": [
        {
          "type": "message",
          "attributes": [
            {
              "key": "action",
              "value": "send"
            },
            {
              "key": "sender",
              "value": "sender_address"
            },
            {
              "key": "module",
              "value": "bank"
            }
          ]
        },
        {
          "type": "transfer",
          "attributes": [
            {
              "key": "recipient",
              "value": "recipient_address"
            },
            {
              "key": "sender",
              "value": "sender_address"
            },
            {
              "key": "amount",
              "value": "1000stake"
            }
          ]
        }
      ]
    }
  ],
  "info": "",
  "gas_wanted": "200000",
  "gas_used": "78546",
  "tx": null,
  "timestamp": "2023-10-30T12:34:56Z"
}
```

## API CosmWasm

### Danh sách Contracts

```http
GET /cosmwasm/wasm/v1/code
```

Trả về danh sách tất cả các mã contract đã được tải lên blockchain.

**Phản hồi:**

```json
{
  "code_infos": [
    {
      "code_id": "1",
      "creator": "cosmos1creator",
      "data_hash": "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
      "instantiate_permission": {
        "permission": "OnlyAddress",
        "address": "cosmos1permission",
        "addresses": []
      }
    },
    {
      "code_id": "2",
      "creator": "cosmos1creator2",
      "data_hash": "FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210",
      "instantiate_permission": {
        "permission": "Everybody",
        "address": "",
        "addresses": []
      }
    }
  ],
  "pagination": {
    "next_key": null,
    "total": "2"
  }
}
```

### Chi tiết Contract

```http
GET /cosmwasm/wasm/v1/code/{code_id}
```

Trả về thông tin chi tiết về một contract code cụ thể.

**Phản hồi:**

```json
{
  "code_info": {
    "code_id": "1",
    "creator": "cosmos1creator",
    "data_hash": "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
    "instantiate_permission": {
      "permission": "OnlyAddress",
      "address": "cosmos1permission",
      "addresses": []
    }
  },
  "data": "base64_encoded_wasm_binary"
}
```

### Truy vấn Trạng thái Contract

```http
GET /cosmwasm/wasm/v1/contract/{contract_address}/smart/{query_data}
```

Thực hiện truy vấn thông minh đến contract, trong đó `query_data` là dữ liệu truy vấn được mã hóa Base64.

**Phản hồi:**

```json
{
  "data": {
    "name": "EduCert Contract",
    "version": "1.0.0",
    "owner": "cosmos1owner",
    "total_credentials": "156",
    "active_issuers": ["cosmos1issuer1", "cosmos1issuer2"]
  }
}
```

### Thực thi Contract

```http
POST /cosmwasm/wasm/v1/tx
```

**Body:**

```json
{
  "type": "cosmwasm/MsgExecuteContract",
  "value": {
    "sender": "sender_address",
    "contract": "contract_address",
    "msg": {
      // Contract specific message
    },
    "funds": []
  }
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "codespace": "",
  "code": 0,
  "data": "0A1E0A1C2F636F736D7761736D2E7761736D2E76312E4D736745786563757465",
  "raw_log": "[{\"events\":[{\"type\":\"execute\",\"attributes\":[{\"key\":\"_contract_address\",\"value\":\"cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr\"}]},{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"/cosmwasm.wasm.v1.MsgExecuteContract\"},{\"key\":\"module\",\"value\":\"wasm\"},{\"key\":\"sender\",\"value\":\"cosmos1sender\"}]},{\"type\":\"wasm\",\"attributes\":[{\"key\":\"_contract_address\",\"value\":\"cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr\"},{\"key\":\"action\",\"value\":\"issue_credential\"}]}]}]",
  "info": "",
  "gas_wanted": "200000",
  "gas_used": "102546",
  "tx": null,
  "timestamp": "2023-10-30T12:34:56Z"
}
```

## API EduCert

### Cấp Văn bằng

```http
POST /edu-cert/issue
```

**Body:**

```json
{
  "base_req": {
    "from": "issuer_address",
    "chain_id": "educhain-1"
  },
  "hash": "sha256_hash_of_credential",
  "metadata": "credential_metadata_json",
  "issuer": "issuer_institution_id",
  "signature": "issuer_digital_signature"
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "data": "0A1C0A1A2F6564756365727420763120697373756520637265646E7469616C",
  "raw_log": "[{\"events\":[{\"type\":\"issue_credential\",\"attributes\":[{\"key\":\"credential_hash\",\"value\":\"sha256_hash_of_credential\"},{\"key\":\"issuer\",\"value\":\"issuer_institution_id\"},{\"key\":\"timestamp\",\"value\":\"2023-10-30T12:34:56Z\"}]},{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"issue_credential\"},{\"key\":\"module\",\"value\":\"educert\"}]}]}]",
  "logs": [
    {
      "msg_index": 0,
      "log": "",
      "events": [
        {
          "type": "issue_credential",
          "attributes": [
            {
              "key": "credential_hash",
              "value": "sha256_hash_of_credential"
            },
            {
              "key": "issuer",
              "value": "issuer_institution_id"
            },
            {
              "key": "timestamp",
              "value": "2023-10-30T12:34:56Z"
            }
          ]
        }
      ]
    }
  ],
  "gas_wanted": "200000",
  "gas_used": "86421",
  "timestamp": "2023-10-30T12:34:56Z"
}
```

### Xác minh Văn bằng

```http
GET /edu-cert/verify/{credential_hash}
```

Trả về trạng thái xác minh của một văn bằng dựa trên hash của nó.

**Phản hồi:**

```json
{
  "verified": true,
  "credential": {
    "hash": "sha256_hash_of_credential",
    "issuer": "issuer_institution_id",
    "issue_date": "2023-06-19T09:00:00Z",
    "metadata": {
      "student_name": "Nguyễn Văn A",
      "degree": "Kỹ sư Phần mềm",
      "grade": "Giỏi",
      "graduation_date": "2023-06-15"
    },
    "revoked": false
  },
  "issuer_info": {
    "name": "Đại học Bách Khoa Hà Nội",
    "id": "issuer_institution_id",
    "status": "active",
    "verified": true
  }
}
```

### Kiểm tra Thu hồi

```http
GET /edu-cert/revocation/{credential_hash}
```

Kiểm tra xem một văn bằng có bị thu hồi hay không.

**Phản hồi:**

```json
{
  "credential_hash": "sha256_hash_of_credential",
  "revoked": false,
  "revocation_info": null
}
```

Ví dụ khi văn bằng đã bị thu hồi:

```json
{
  "credential_hash": "sha256_hash_of_credential",
  "revoked": true,
  "revocation_info": {
    "revoked_at": "2023-12-15T10:30:45Z",
    "revoked_by": "issuer_institution_id",
    "reason": "Phát hiện gian lận học thuật",
    "evidence_hash": "sha256_hash_of_evidence"
  }
}
```

## API EduID

### Đăng ký DID

```http
POST /edu-id/register
```

**Body:**

```json
{
  "base_req": {
    "from": "owner_address",
    "chain_id": "educhain-1"
  },
  "did_doc": {
    "context": "https://www.w3.org/ns/did/v1",
    "id": "did:eduid:123456789abcdefghi",
    "public_key": "public_key_base58",
    "service_endpoint": "https://example.com/endpoint"
  }
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "data": "0A160A142F65647569642076312072656769737465722064696420",
  "raw_log": "[{\"events\":[{\"type\":\"register_did\",\"attributes\":[{\"key\":\"did\",\"value\":\"did:eduid:123456789abcdefghi\"},{\"key\":\"owner\",\"value\":\"owner_address\"},{\"key\":\"timestamp\",\"value\":\"2023-10-30T12:34:56Z\"}]},{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"register_did\"},{\"key\":\"module\",\"value\":\"eduid\"}]}]}]",
  "gas_wanted": "200000",
  "gas_used": "92345",
  "timestamp": "2023-10-30T12:34:56Z"
}
```

### Truy vấn DID

```http
GET /edu-id/did/{did}
```

Trả về DID Document cho một DID cụ thể.

**Phản hồi:**

```json
{
  "did_document": {
    "@context": "https://www.w3.org/ns/did/v1",
    "id": "did:eduid:123456789abcdefghi",
    "verificationMethod": [
      {
        "id": "did:eduid:123456789abcdefghi#keys-1",
        "type": "Ed25519VerificationKey2020",
        "controller": "did:eduid:123456789abcdefghi",
        "publicKeyBase58": "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
      }
    ],
    "authentication": [
      "did:eduid:123456789abcdefghi#keys-1"
    ],
    "service": [
      {
        "id": "did:eduid:123456789abcdefghi#service-1",
        "type": "IdentityService",
        "serviceEndpoint": "https://example.com/endpoint"
      }
    ],
    "created": "2023-06-19T10:15:30Z",
    "updated": "2023-06-19T10:15:30Z"
  },
  "metadata": {
    "versionId": "1",
    "status": "active",
    "deactivated": false
  }
}
```

### Truy vấn Hash DID

```http
GET /edu-id/hash/{did}
```

Trả về hash của DID Document.

**Phản hồi:**

```json
{
  "did": "did:eduid:123456789abcdefghi",
  "hash": "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
  "last_updated": "2023-06-19T10:15:30Z"
}
```

## API EduPay

### Tạo Escrow Thanh toán

```http
POST /edu-pay/create-escrow
```

**Body:**

```json
{
  "base_req": {
    "from": "payer_address",
    "chain_id": "educhain-1"
  },
  "recipient": "school_address",
  "amount": [
    {
      "denom": "evnd",
      "amount": "5000000"
    }
  ],
  "enrollment_id": "enrollment_reference_id"
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "data": "0A1A0A182F6564757061792076312063726561746520657363726F7720",
  "raw_log": "[{\"events\":[{\"type\":\"create_escrow\",\"attributes\":[{\"key\":\"escrow_id\",\"value\":\"escrow-123456\"},{\"key\":\"payer\",\"value\":\"payer_address\"},{\"key\":\"recipient\",\"value\":\"school_address\"},{\"key\":\"amount\",\"value\":\"5000000evnd\"},{\"key\":\"enrollment_id\",\"value\":\"enrollment_reference_id\"}]},{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"create_escrow\"},{\"key\":\"module\",\"value\":\"edupay\"}]}]}]",
  "gas_wanted": "200000",
  "gas_used": "86731",
  "timestamp": "2023-10-30T12:34:56Z",
  "escrow_id": "escrow-123456"
}
```

### Giải ngân Escrow

```http
POST /edu-pay/release/{escrow_id}
```

**Body:**

```json
{
  "base_req": {
    "from": "authorized_address",
    "chain_id": "educhain-1"
  }
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "data": "0A1B0A192F6564757061792076312072656C6561736520657363726F7720",
  "raw_log": "[{\"events\":[{\"type\":\"release_escrow\",\"attributes\":[{\"key\":\"escrow_id\",\"value\":\"escrow-123456\"},{\"key\":\"payer\",\"value\":\"payer_address\"},{\"key\":\"recipient\",\"value\":\"school_address\"},{\"key\":\"amount\",\"value\":\"5000000evnd\"},{\"key\":\"status\",\"value\":\"released\"}]},{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"release_escrow\"},{\"key\":\"module\",\"value\":\"edupay\"}]}]}]",
  "gas_wanted": "200000",
  "gas_used": "68452",
  "timestamp": "2023-10-30T12:34:56Z"
}
```

### Kiểm tra Escrow

```http
GET /edu-pay/escrow/{escrow_id}
```

Trả về thông tin chi tiết về một escrow cụ thể.

**Phản hồi:**

```json
{
  "escrow_id": "escrow-123456",
  "payer": "payer_address",
  "recipient": "school_address",
  "amount": [
    {
      "denom": "evnd",
      "amount": "5000000"
    }
  ],
  "enrollment_id": "enrollment_reference_id",
  "status": "active",
  "created_at": "2023-10-30T10:15:30Z",
  "expires_at": "2023-11-30T10:15:30Z",
  "released_at": null,
  "refunded_at": null
}
```

## API ResearchLedger

### Đăng ký Hash Nghiên cứu

```http
POST /research-ledger/register
```

**Body:**

```json
{
  "base_req": {
    "from": "researcher_address",
    "chain_id": "educhain-1"
  },
  "hash": "sha256_hash_of_research_document",
  "metadata": {
    "title": "Research Title",
    "authors": ["Author1", "Author2"],
    "date": "2025-06-19T12:00:00Z",
    "keywords": ["keyword1", "keyword2"]
  }
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "data": "0A230A212F726573656172636820763120726567697374657220646F63756D656E7420",
  "raw_log": "[{\"events\":[{\"type\":\"register_research\",\"attributes\":[{\"key\":\"document_hash\",\"value\":\"sha256_hash_of_research_document\"},{\"key\":\"researcher\",\"value\":\"researcher_address\"},{\"key\":\"timestamp\",\"value\":\"2023-10-30T12:34:56Z\"}]},{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"register_research\"},{\"key\":\"module\",\"value\":\"researchledger\"}]}]}]",
  "gas_wanted": "200000",
  "gas_used": "76543",
  "timestamp": "2023-10-30T12:34:56Z"
}
```

### Truy vấn Nghiên cứu

```http
GET /research-ledger/document/{hash}
```

Trả về metadata của tài liệu nghiên cứu dựa trên hash.

**Phản hồi:**

```json
{
  "document_hash": "sha256_hash_of_research_document",
  "researcher": "researcher_address",
  "registered_at": "2023-10-30T12:34:56Z",
  "metadata": {
    "title": "Research Title",
    "authors": ["Author1", "Author2"],
    "date": "2025-06-19T12:00:00Z",
    "keywords": ["keyword1", "keyword2"],
    "abstract": "This research paper presents...",
    "publication_status": "published",
    "doi": "10.1234/example.doi"
  },
  "verification": {
    "verified": true,
    "verifier": "verifier_address",
    "verified_at": "2023-10-31T09:22:15Z"
  }
}
```

### Kiểm tra Đạo văn

```http
POST /research-ledger/check-plagiarism
```

**Body:**

```json
{
  "base_req": {
    "from": "checker_address",
    "chain_id": "educhain-1"
  },
  "document_hash": "sha256_hash_to_check",
  "similarity_threshold": 0.8
}
```

**Phản hồi:**

```json
{
  "request_id": "plagcheck-789012",
  "document_hash": "sha256_hash_to_check",
  "status": "completed",
  "result": {
    "plagiarism_detected": false,
    "similarity_score": 0.15,
    "similar_documents": [
      {
        "document_hash": "another_document_hash",
        "similarity": 0.15,
        "matching_sections": [
          {
            "section": "introduction",
            "similarity": 0.32
          }
        ]
      }
    ],
    "timestamp": "2023-10-30T12:40:22Z"
  }
}
```

## API EduAdmission

### Phát hành Seat-NFT

```http
POST /edu-admission/mint-seat
```

**Body:**

```json
{
  "base_req": {
    "from": "institution_address",
    "chain_id": "educhain-1"
  },
  "program_id": "program_identifier",
  "quantity": 100,
  "metadata": {
    "institution": "University Name",
    "academic_year": "2025-2026",
    "program": "Computer Science"
  }
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "data": "0A1F0A1D2F65647561646D697373696F6E2076312063726561746520736561747320",
  "raw_log": "[{\"events\":[{\"type\":\"mint_seats\",\"attributes\":[{\"key\":\"program_id\",\"value\":\"program_identifier\"},{\"key\":\"quantity\",\"value\":\"100\"},{\"key\":\"institution\",\"value\":\"institution_address\"},{\"key\":\"batch_id\",\"value\":\"seat-batch-654321\"}]},{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"mint_seats\"},{\"key\":\"module\",\"value\":\"eduadmission\"}]}]}]",
  "gas_wanted": "300000",
  "gas_used": "156789",
  "timestamp": "2023-10-30T12:34:56Z",
  "batch_id": "seat-batch-654321"
}
```

### Đăng ký Tuyển sinh

```http
POST /edu-admission/apply
```

**Body:**

```json
{
  "base_req": {
    "from": "student_address",
    "chain_id": "educhain-1"
  },
  "program_id": "program_identifier",
  "student_hash": "sha256_hash_of_student_credentials",
  "preferences": [1, 2, 3]
}
```

**Phản hồi:**

```json
{
  "height": "42",
  "txhash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "data": "0A1A0A182F65647561646D697373696F6E2076312061706C792020",
  "raw_log": "[{\"events\":[{\"type\":\"application_submitted\",\"attributes\":[{\"key\":\"program_id\",\"value\":\"program_identifier\"},{\"key\":\"student\",\"value\":\"student_address\"},{\"key\":\"student_hash\",\"value\":\"sha256_hash_of_student_credentials\"},{\"key\":\"application_id\",\"value\":\"app-567890\"}]},{\"type\":\"message\",\"attributes\":[{\"key\":\"action\",\"value\":\"submit_application\"},{\"key\":\"module\",\"value\":\"eduadmission\"}]}]}]",
  "gas_wanted": "200000",
  "gas_used": "98765",
  "timestamp": "2023-10-30T12:34:56Z",
  "application_id": "app-567890"
}
```

### Truy vấn Kết quả Tuyển sinh

```http
GET /edu-admission/results/{student_hash}
```

Trả về kết quả tuyển sinh cho một học sinh cụ thể.

**Phản hồi:**

```json
{
  "student_hash": "sha256_hash_of_student_credentials",
  "applications": [
    {
      "application_id": "app-567890",
      "program_id": "program_identifier",
      "status": "accepted",
      "seat_token_id": "seat-token-123",
      "applied_at": "2023-10-30T12:34:56Z",
      "processed_at": "2023-11-02T09:15:22Z",
      "program_details": {
        "institution": "University Name",
        "program": "Computer Science",
        "academic_year": "2025-2026"
      },
      "rank": 42,
      "score": 87.5
    },
    {
      "application_id": "app-567891",
      "program_id": "program_identifier_2",
      "status": "waitlisted",
      "seat_token_id": null,
      "applied_at": "2023-10-30T12:40:18Z",
      "processed_at": "2023-11-02T09:16:45Z",
      "program_details": {
        "institution": "Another University",
        "program": "Data Science",
        "academic_year": "2025-2026"
      },
      "rank": 105,
      "score": 82.3
    }
  ]
}
```

## Lỗi và Mã Trạng thái

| Mã HTTP | Mô tả |
|---------|-------|
| 200 | Thành công |
| 400 | Yêu cầu không hợp lệ |
| 401 | Không được xác thực |
| 403 | Không có quyền truy cập |
| 404 | Không tìm thấy tài nguyên |
| 500 | Lỗi máy chủ nội bộ |

**Ví dụ phản hồi lỗi:**

```json
{
  "code": 400,
  "message": "Yêu cầu không hợp lệ",
  "details": [
    {
      "type": "validation_error",
      "field": "amount",
      "description": "Số tiền phải lớn hơn 0"
    }
  ]
}
```

## Giới hạn Rate

- Limit: 100 yêu cầu/phút cho mỗi IP
- Rate limit được áp dụng cho tất cả các API endpoints

**Phản hồi khi vượt quá giới hạn:**

```json
{
  "code": 429,
  "message": "Quá nhiều yêu cầu",
  "details": {
    "rate_limit": 100,
    "rate_window": "60s",
    "retry_after": 45
  }
}
```

## Ví dụ Sử dụng (Curl)

Lấy thông tin tài khoản:

```bash
curl -X GET "http://localhost:1317/cosmos/auth/v1beta1/accounts/cosmos1abcdefghijklmnopqrstuvwxyz"
```

Truy vấn trạng thái contract EduCert:

```bash
curl -X GET "http://localhost:1317/cosmwasm/wasm/v1/contract/cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr/smart/eyJnZXRfY3JlZGVudGlhbCI6eyJoYXNoIjoiYWJjMTIzIn19"
```

## Hướng dẫn Sử dụng SDK TypeScript

Ví dụ tương tác với API sử dụng TypeScript SDK:

```typescript
import { EduChainClient } from "@educhain/ts-sdk";

// Khởi tạo client
const client = new EduChainClient({
  rpcUrl: "http://localhost:26657",
  restUrl: "http://localhost:1317",
});

// Lấy thông tin văn bằng
async function getCredential(hash: string) {
  const response = await client.educert.getCredential(hash);
  console.log(response);
}

// Tạo escrow thanh toán
async function createEscrow(amount: string, recipient: string) {
  const wallet = await client.loadWallet("your-mnemonic");
  const tx = await client.edupay.createEscrow({
    payer: wallet.address,
    recipient,
    amount: [{ denom: "evnd", amount }],
    enrollmentId: "enroll-123",
  });
  console.log("Transaction hash:", tx.transactionHash);
}
```

**Ví dụ kết quả gọi SDK:**

```json
// Kết quả của getCredential()
{
  "verified": true,
  "credential": {
    "hash": "sha256_hash_of_credential",
    "issuer": "issuer_institution_id",
    "issue_date": "2023-06-19T09:00:00Z",
    "metadata": {
      "student_name": "Nguyễn Văn A",
      "degree": "Kỹ sư Phần mềm",
      "grade": "Giỏi",
      "graduation_date": "2023-06-15"
    },
    "revoked": false
  }
}

// Kết quả của createEscrow()
{
  "transactionHash": "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
  "escrowId": "escrow-123456",
  "height": 42,
  "gasUsed": "86731"
}
```
