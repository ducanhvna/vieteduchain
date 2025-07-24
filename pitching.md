# Tài liệu mô tả kỹ thuật dự án VietEduChain

---
**Tóm tắt tài liệu:**
Tài liệu này trình bày tổng quan kiến trúc, thành phần kỹ thuật, quy trình vận hành, các luồng nghiệp vụ và giải pháp công nghệ của dự án VietEduChain – một nền tảng blockchain cho giáo dục, tích hợp backend, frontend, smart contract, lưu trữ phi tập trung, cơ chế phần thưởng, NFT, DID và các dịch vụ gia tăng. Tài liệu cũng phân tích ưu điểm, so sánh với các hệ thống hiện có, và nêu các thách thức kỹ thuật thực tế.

**Bảng các từ viết tắt:**
| Từ viết tắt | Ý nghĩa |
|-------------|-------------------------------------------------------------|
| BE          | Backend (hệ thống phía máy chủ)                             |
| FE          | Frontend (giao diện người dùng)                             |
| API         | Application Programming Interface (giao diện lập trình ứng dụng) |
| DID         | Decentralized Identifier (định danh phi tập trung)          |
| NFT         | Non-Fungible Token (token không thể thay thế)               |
| eVND        | Electronic VND (stablecoin mô phỏng VNĐ số)                 |
| MinIO       | Hệ thống lưu trữ đối tượng tương thích S3                   |
| CI/CD       | Continuous Integration/Continuous Deployment                |
| VM          | Virtual Machine (máy ảo)                                    |
| REST        | Representational State Transfer (chuẩn API phổ biến)         |
| P2P         | Peer-to-Peer (mạng ngang hàng)                              |
| WASM        | WebAssembly (chuẩn máy ảo thực thi hợp đồng thông minh)      |
| CosmWasm    | Framework hợp đồng thông minh cho Cosmos SDK                 |
| FastAPI     | Framework Python cho API hiệu năng cao                      |
| CW20        | Chuẩn token fungible trên CosmWasm                          |
| CW721       | Chuẩn NFT trên CosmWasm                                     |
| RPC         | Remote Procedure Call (giao thức gọi hàm từ xa)             |
| gRPC        | Giao thức RPC hiệu năng cao của Google                      |
| S3          | Simple Storage Service (chuẩn lưu trữ đối tượng của AWS)     |
| Genesis     | Khởi tạo chuỗi blockchain ban đầu                           |
| Airdrop     | Phát token miễn phí cho người dùng mới                      |
| Hot reload  | Tự động tải lại mã nguồn khi phát triển                     |
| Escrow      | Tài khoản ký quỹ trung gian (cơ chế giữ tiền tạm thời, chỉ giải ngân khi đủ điều kiện; thường dùng để đảm bảo an toàn giao dịch giữa học sinh và trường, ví dụ: học phí chỉ chuyển cho trường khi học sinh xác nhận nhập học/thỏa mãn điều kiện hợp đồng) |
| Staking     | Cơ chế đặt cọc, xác thực mạng lưới                          |
| Validator   | Node xác thực giao dịch trên blockchain                     |
| Node        | Máy chủ tham gia mạng blockchain                            |
| Contract    | Hợp đồng thông minh                                         |
| Mainnet     | Mạng blockchain chính thức                                  |
| Devnet      | Mạng blockchain phát triển/test                             |


## Danh sách các Smart Contract và Điều kiện Thực thi

### 1. Danh sách các Smart Contract chính

| Tên Smart Contract   | Chức năng chính                                                                 | Dữ liệu lưu trữ chính                |
|----------------------|-------------------------------------------------------------------------------|--------------------------------------|
| **eduid**            | Quản lý định danh phi tập trung (DID), xác thực, quyền sở hữu, dịch vụ liên quan| DID Document, metadata, mapping ví   |
| **educert**          | Quản lý cấp phát, thu hồi, xác thực chứng chỉ số (Verifiable Credential), mint NFT chứng chỉ | Credential, NFT, metadata, lịch sử   |
| **eduadmission**     | Quản lý tuyển sinh, điểm số, kết quả xét tuyển, NFT ghế tuyển sinh, thuật toán matching | NFT ghế, điểm số, kết quả, metadata  |
| **edupay**           | Quản lý thanh toán, escrow giữa học sinh và trường học, giải ngân tự động     | Escrow, giao dịch, proof, trạng thái |
| **researchledger**   | Đăng ký fingerprint dữ liệu nghiên cứu, quản lý DOI, xác thực tác quyền, thưởng phát hiện đạo văn | Fingerprint, DOI, NFT nghiên cứu     |

### 2. Điều kiện để Smart Contract được thực thi


#### **eduid**
- Định danh (DID) hợp lệ theo chuẩn W3C (did:method:id), đúng format, chưa bị thu hồi.
- Người thực hiện là chủ sở hữu DID hoặc có quyền kiểm soát (controller).
- Không bị trạng thái revoked.

**Ví dụ điều kiện thực thi chức năng xác thực DID (VerifyDID):**

Giả sử người dùng hoặc hệ thống muốn xác thực một DID trên smart contract `eduid`, các điều kiện sau phải thỏa mãn:

1. DID phải đúng định dạng chuẩn, ví dụ: `did:eduid:123456789abcdef`.
2. DID đã được đăng ký trên hệ thống (tồn tại DID Document).
3. DID chưa bị thu hồi (không có trạng thái revoked).
4. Nếu xác thực quyền sở hữu, người xác thực phải là chủ sở hữu hoặc controller của DID.

**Luồng kiểm tra thực tế:**
- Hệ thống nhận yêu cầu xác thực DID từ client.
- Kiểm tra định dạng DID hợp lệ.
- Truy vấn DID Document từ smart contract:
    - Nếu không tồn tại, trả về "DID không tồn tại".
    - Nếu có trạng thái revoked, trả về "DID đã bị thu hồi".
    - Nếu hợp lệ, trả về thông tin xác thực (valid=true, active=true).

**Ví dụ mã giả:**
```rust
fn verify_did(did: String) -> VerifyDIDResponse {
    if !is_valid_format(&did) {
        return VerifyDIDResponse { valid: false, active: false, reason: Some("Sai định dạng") };
    }
    if !did_exists(&did) {
        return VerifyDIDResponse { valid: false, active: false, reason: Some("DID không tồn tại") };
    }
    if is_revoked(&did) {
        return VerifyDIDResponse { valid: true, active: false, reason: Some("DID đã bị thu hồi") };
    }
    VerifyDIDResponse { valid: true, active: true, reason: None }
}
```


#### **educert**
- DID của người nhận credential phải hợp lệ, tồn tại trên hệ thống (đã đăng ký qua eduid).
- Credential chưa bị thu hồi, không trùng lặp.
- Chỉ tổ chức/cá nhân có quyền cấp phát mới được phép mint hoặc thu hồi credential.
- Đáp ứng điều kiện nghiệp vụ (ví dụ: hoàn thành khóa học, được xác nhận bởi tổ chức).

**Giải thích về định danh node khi biểu quyết quyền cấp bằng:**

Khi thực hiện biểu quyết (voting) để quyết định node nào có quyền cấp bằng (mint credential), mỗi node trong hệ thống blockchain sẽ được định danh bằng **địa chỉ ví (address)** duy nhất trên chuỗi. Địa chỉ này thường là địa chỉ tài khoản validator hoặc operator của node, ví dụ: `evnd1...`, tương tự như địa chỉ ví người dùng nhưng thuộc về node vận hành.

- **Địa chỉ node**: Là địa chỉ ví public (account address) được tạo khi khởi tạo node, dùng để nhận diện node trong các giao dịch, staking, voting, và các hoạt động quản trị chuỗi.
- **Phân biệt node**: Mỗi node có một địa chỉ duy nhất, không trùng lặp, được sử dụng để ghi nhận quyền biểu quyết, quyền xác thực, và các quyền đặc biệt như cấp phát credential.
- **Biểu quyết**: Khi có đề xuất (proposal) về quyền cấp bằng, các node sẽ sử dụng địa chỉ ví của mình để bỏ phiếu (vote) trên smart contract hoặc module quản trị chuỗi. Kết quả biểu quyết sẽ ghi nhận theo địa chỉ node.

**Tóm lại:**
> Node được định danh và phân biệt bằng địa chỉ ví (account address) trên blockchain, đây là địa chỉ dùng để xác thực quyền biểu quyết, quyền cấp bằng và các quyền quản trị khác trong hệ thống.

#### **eduadmission**
- DID của thí sinh và tổ chức đều hợp lệ, chưa bị thu hồi.
- Thí sinh đáp ứng điều kiện xét tuyển (điểm số, credential liên quan).
- NFT ghế tuyển sinh chưa được mint hoặc chưa bị chiếm dụng.
- Đúng thời gian tuyển sinh, không vượt quá quota.


#### **edupay**
- Các bên tham gia (học sinh, trường) đều có DID hợp lệ.
- Có đủ số dư eVND hoặc token để thực hiện giao dịch.
- Đáp ứng điều kiện escrow (ví dụ: xác nhận nhập học, hoàn thành dịch vụ).
- Không bị khóa tài khoản hoặc bị flagged gian lận.


**Giải thích về Escrow, phân bổ/sử dụng học phí và quản lý học bổng:**

**Escrow** là tài khoản ký quỹ trung gian trên blockchain, nơi học phí hoặc khoản thanh toán được "giữ tạm thời" thay vì chuyển trực tiếp cho trường ngay khi học sinh đăng ký. Số tiền này chỉ được giải ngân cho trường khi các điều kiện hợp đồng được đáp ứng (ví dụ: học sinh xác nhận nhập học, hoàn thành thủ tục, hoặc hết thời gian khiếu nại).

**Quy trình giải ngân và phân bổ học phí dùng escrow:**
1. Học sinh chuyển học phí vào tài khoản escrow (qua smart contract edupay).
2. Smart contract ghi nhận số tiền và trạng thái giao dịch (pending).
3. Khi học sinh xác nhận nhập học/thỏa mãn điều kiện hợp đồng (qua API hoặc smart contract), smart contract sẽ tự động chuyển (giải ngân) học phí từ escrow sang ví của trường hoặc phân bổ theo tỷ lệ đã định (ví dụ: chia cho các bộ phận, quỹ phát triển, giáo viên...).
4. Nếu có tranh chấp hoặc không đủ điều kiện, tiền có thể hoàn lại cho học sinh hoặc xử lý theo quy định hợp đồng.

**Quản lý học bổng:**
- Học bổng có thể được cấp phát tự động qua smart contract dựa trên điều kiện (điểm số, thành tích, hoàn cảnh, đề xuất từ trường...).
- Quỹ học bổng được nạp vào smart contract, chỉ giải ngân cho học sinh đủ điều kiện (qua xác thực DID, kiểm tra tiêu chí).
- Học sinh nhận học bổng sẽ được chuyển trực tiếp vào ví cá nhân hoặc trừ vào học phí (nếu có).
- Toàn bộ quá trình cấp phát, sử dụng học bổng đều minh bạch, truy vết được trên blockchain.

**Lợi ích:**
- Đảm bảo an toàn cho cả học sinh và trường, tránh lừa đảo hoặc tranh chấp.
- Tăng tính minh bạch, tự động hóa quy trình thanh toán, phân bổ tài chính, cấp phát học bổng, giảm rủi ro và gian lận.

#### **researchledger**
- DID của tác giả/nghiên cứu viên hợp lệ.
- Dữ liệu fingerprint chưa bị trùng lặp, chưa bị thu hồi.
- Đáp ứng điều kiện xác thực (ví dụ: có credential nghiên cứu, xác nhận của tổ chức).

---

## 1. Tổng quan dự án
VietEduChain là nền tảng blockchain permissioned dựa trên Cosmos SDK, tích hợp các dịch vụ backend (BE) và frontend (FE) để cung cấp các API quản lý định danh, chứng chỉ, thanh toán và lưu trữ dữ liệu phi tập trung cho lĩnh vực giáo dục.

## 2. Kiến trúc tổng thể
- **Backend (BE):**
  - Sử dụng Cosmos SDK (wasmd) để triển khai blockchain permissioned.
  - FastAPI Python phục vụ các API tùy chỉnh.
  - Tích hợp MinIO làm hệ thống lưu trữ đối tượng (object storage).
  - Các smart contract quản lý DID, chứng chỉ, tuyển sinh, thanh toán.
- **Frontend (FE):**
  - Ứng dụng web hiện đại (Next.js) giao tiếp với API backend và blockchain.

## 3. Thành phần kỹ thuật chính
### 3.1. Blockchain Node (wasm-node)

#### Thành phần hệ thống backend node

**1. Core Cosmos (wasmd node):**
  - Chạy blockchain permissioned dựa trên Cosmos SDK (wasmd).
  - Quản lý consensus, lưu trữ trạng thái, xác thực giao dịch, staking, validator.
  - Expose các port:
    - `26656`: P2P (giao tiếp node mạng lưới)
    - `26657`: RPC (giao tiếp client, truy vấn trạng thái, gửi giao dịch)
    - `1317`: Cosmos REST API (chuẩn REST Cosmos)
    - `9090`: gRPC (giao tiếp hiệu năng cao, tích hợp dịch vụ)

**2. Smart contract (CosmWasm):**
  - Các module hợp đồng thông minh: eduid, educert, eduadmission, edupay, researchledger.
  - Lưu trữ và xử lý logic nghiệp vụ giáo dục: DID, credential, tuyển sinh, thanh toán, nghiên cứu.
  - Được deploy và quản lý bởi wasmd node.

**3. API backend (FastAPI):**
  - Cung cấp API RESTful cho frontend, bot, mobile.
  - Mapping dữ liệu blockchain, smart contract, MinIO.
  - Expose port:
    - `1318`: Custom REST API (FastAPI Python)

**4. MinIO (object storage):**
  - Lưu trữ dữ liệu lớn, metadata, file động, tài liệu scan, log, v.v.
  - Expose port:
    - `9000`: MinIO API (S3 compatible)
    - `9001`: MinIO console (giao diện quản trị)

**5. Quan hệ các thành phần:**
  - FastAPI giao tiếp với wasmd (qua RPC, REST, gRPC) và smart contract (CosmWasm) để thực hiện nghiệp vụ.
  - FastAPI truy xuất/lưu file qua MinIO (metadata, file lớn, dữ liệu động).
  - Smart contract lưu trạng thái nghiệp vụ, liên kết DID, credential, escrow, v.v.
  - Các port đảm bảo các thành phần giao tiếp nội bộ và với client/FE.

**Tóm tắt:**
Các thành phần backend node được tổ chức module hóa, mỗi thành phần đảm nhận một vai trò rõ ràng, giao tiếp qua các port tiêu chuẩn, đảm bảo mở rộng, tích hợp và phát triển linh hoạt.

### 3.2. MinIO Storage
- MinIO là hệ thống lưu trữ đối tượng (object storage) phi tập trung, tương thích chuẩn S3, được tích hợp để giải quyết các bài toán lưu trữ dữ liệu lớn, dữ liệu động mà blockchain không phù hợp lưu trực tiếp.
- **Vai trò và ứng dụng trong hệ thống:**
  - **Lưu trữ thông tin bổ sung cho giao dịch blockchain:**
    - Hồ sơ học sinh, sinh viên (profile, giấy tờ, ảnh, tài liệu scan, file PDF, v.v.).
    - Metadata, tài liệu đính kèm cho các giao dịch chứng chỉ, tuyển sinh, thanh toán, nghiên cứu.
    - Dữ liệu minigame, lịch sử chơi, phần thưởng, vật phẩm ảo, ảnh đại diện, v.v.
    - Thông tin đăng nhập, xác thực đa yếu tố (OTP, QR, session, log truy cập).
    - Các file lớn, dữ liệu nhị phân, log, backup, dữ liệu tạm thời.
  - **Tối ưu hiệu suất và chi phí:**
    - Blockchain chỉ lưu hash, reference hoặc metadata, còn dữ liệu thực tế lưu trên MinIO giúp giảm tải cho "sổ cái", tránh phình to dữ liệu, tăng tốc độ xác thực giao dịch.
    - Cho phép lưu trữ dữ liệu không cần bất biến tuyệt đối (mutable), hoặc dữ liệu cần cập nhật thường xuyên.
  - **Bảo mật và kiểm soát truy cập:**
    - MinIO hỗ trợ phân quyền truy cập, public/private bucket, token truy xuất tạm thời, giúp bảo vệ dữ liệu nhạy cảm.
    - Có thể tích hợp xác thực với hệ thống quản lý người dùng, xác thực OAuth, SSO, v.v.
  - **Khả năng mở rộng và tích hợp:**
    - Dễ dàng mở rộng dung lượng, cluster, backup, đồng bộ với các hệ thống lưu trữ khác (AWS S3, Google Cloud Storage, v.v.).
    - API RESTful cho phép FE/BE truy xuất, upload/download file linh hoạt.
  - **Tính minh bạch và truy xuất nguồn gốc:**
    - Kết hợp lưu hash hoặc link file trên blockchain để đảm bảo tính toàn vẹn, truy xuất nguồn gốc dữ liệu khi cần kiểm tra, đối soát.
- **Tóm lại:**
  - MinIO là thành phần không thể thiếu giúp hệ thống VietEduChain lưu trữ dữ liệu lớn, động, bảo mật, tiết kiệm chi phí và tối ưu hiệu suất, đồng thời vẫn đảm bảo tính minh bạch, truy xuất nguồn gốc nhờ liên kết với blockchain.

### 3.3. Frontend (FE)

- Sử dụng Next.js (React) cho giao diện người dùng.
- Giao tiếp với các API backend và blockchain qua REST/gRPC.
- Dockerfile và docker-compose riêng biệt (không chi tiết ở đây, nhưng FE nằm trong thư mục `fe/`).



### 3.4. Kiến trúc và Quan hệ các Smart Contract Core

Hệ thống sử dụng các smart contract CosmWasm (Rust) tổ chức thành các module nghiệp vụ, có quan hệ chặt chẽ với nhau để đảm bảo luồng dữ liệu xuyên suốt:

| Module         | Chức năng chính                                                                 | Dữ liệu lưu trữ chính                | Quan hệ với module khác |
|----------------|-------------------------------------------------------------------------------|--------------------------------------|------------------------|
| **eduid**      | Quản lý định danh phi tập trung (DID) cho cá nhân/tổ chức, xác thực, quyền sở hữu, dịch vụ liên quan DID | DID Document, metadata, mapping ví   | Liên kết với educert, edupay, eduadmission (gắn DID vào credential, giao dịch, tuyển sinh) |
| **educert**    | Quản lý cấp phát, thu hồi, xác thực chứng chỉ số (Verifiable Credential), mint NFT chứng chỉ | Credential, NFT, metadata, lịch sử   | Gắn DID (eduid), liên kết với eduadmission (chứng chỉ tuyển sinh), researchledger (chứng nhận nghiên cứu) |
| **eduadmission** | Quản lý tuyển sinh, điểm số, kết quả xét tuyển, NFT ghế tuyển sinh, thuật toán matching | NFT ghế, điểm số, kết quả, metadata  | Gắn credential (educert), liên kết DID (eduid), tích hợp edupay (xác nhận nhập học) |
| **edupay**     | Quản lý thanh toán, escrow giữa học sinh và trường học, giải ngân tự động     | Escrow, giao dịch, proof, trạng thái | Liên kết với eduadmission (xác nhận nhập học), eduid (gắn ví), có thể tích hợp với researchledger |
| **researchledger** | Đăng ký fingerprint dữ liệu nghiên cứu, quản lý DOI, xác thực tác quyền, thưởng phát hiện đạo văn | Fingerprint, DOI, NFT nghiên cứu     | Gắn credential (educert), liên kết DID (eduid), có thể tích hợp edupay (thanh toán bản quyền) |

**Sơ đồ luồng dữ liệu và quan hệ:**

1. Người dùng/tổ chức tạo DID (eduid) → dùng DID để đăng ký, nhận credential (educert), tham gia tuyển sinh (eduadmission), thực hiện giao dịch (edupay), hoặc đăng ký nghiên cứu (researchledger).
2. Credential (educert) có thể gắn với DID, dùng làm điều kiện tuyển sinh (eduadmission), hoặc chứng nhận nghiên cứu (researchledger).
3. Khi tuyển sinh thành công (eduadmission), có thể tạo escrow/thanh toán (edupay) và cấp credential liên quan.
4. Các giao dịch, chứng chỉ, nghiên cứu đều có thể liên kết DID để xác thực nguồn gốc, quyền sở hữu.
5. Các module đều có thể tích hợp với MinIO/IPFS để lưu metadata, file lớn, và backend FastAPI để cung cấp API truy xuất dữ liệu.

**Tóm lại:**
- Các smart contract core không hoạt động rời rạc mà liên kết thành một hệ sinh thái dữ liệu xuyên suốt, đảm bảo xác thực, minh bạch, mở rộng linh hoạt cho các nghiệp vụ giáo dục số hóa.



### 3.5. Quy trình minigame, nhận thưởng và mint NFT

**Lý do cần tạo ra các giá trị gia tăng (minigame, nhận thưởng, NFT, nhiệm vụ cộng đồng...):**
- Trong hệ sinh thái blockchain giáo dục, nếu chỉ cung cấp các chức năng truyền thống như lưu trữ chứng chỉ, tuyển sinh, thanh toán... sẽ khó tạo động lực cho người dùng mới tham gia, trải nghiệm và gắn bó lâu dài.
- Việc bổ sung các giá trị gia tăng như minigame, nhiệm vụ nhận thưởng, NFT vật phẩm, sự kiện cộng đồng, phần thưởng token... giúp:
  - Thu hút người dùng mới, tạo hiệu ứng lan tỏa, viral marketing.
  - Tăng tương tác, giữ chân người dùng, xây dựng cộng đồng tích cực.
  - Khuyến khích người dùng xác thực định danh (DID), liên kết ví, hoàn thiện hồ sơ.
  - Tạo thêm nhiều luồng dữ liệu, giao dịch, giúp hệ sinh thái phát triển bền vững.
  - Tăng giá trị sử dụng thực tế cho token (eVND, NFT), tạo động lực cho các node vận hành.
- Đây là xu hướng chung của các hệ sinh thái blockchain hiện đại: kết hợp nghiệp vụ cốt lõi với các dịch vụ gia tăng, gamification, phần thưởng để tạo trải nghiệm hấp dẫn, thúc đẩy tăng trưởng tự nhiên.


#### 3.5.1. Khái niệm "mint NFT chứng chỉ" và quan hệ client với hệ thống

**Mint NFT chứng chỉ** là quá trình tạo ra một NFT (Non-Fungible Token) đại diện cho một chứng chỉ số (verifiable credential) trên blockchain. Mỗi NFT chứng chỉ là duy nhất, không thể làm giả, không thể chỉnh sửa, và gắn liền với thông tin định danh (DID) của cá nhân/tổ chức được cấp. NFT chứng chỉ có thể chứa metadata (tên, loại chứng chỉ, ngày cấp, đơn vị cấp, hash tài liệu gốc, v.v.), liên kết với hồ sơ học sinh/sinh viên, và có thể xác thực nguồn gốc, lịch sử giao dịch công khai trên blockchain.

**Quan hệ của client (ví dụ Telegram user) với các thành phần smart contract, DID:**
- Mỗi client (người dùng Telegram, web, mobile...) đều có thể tạo hoặc liên kết một DID (Decentralized Identifier) với tài khoản của mình. DID này là "chìa khóa" định danh duy nhất trên blockchain.
- Khi người dùng Telegram thực hiện một hành động (ví dụ: hoàn thành minigame, xác thực qua bot, nhận chứng chỉ...), hệ thống backend sẽ xác thực tài khoản Telegram, ánh xạ với DID tương ứng (có thể qua liên kết ví, xác thực OTP, hoặc mapping Telegram ID với DID).
- Khi đủ điều kiện mint NFT chứng chỉ, backend sẽ gửi lệnh mint tới smart contract (educert), truyền vào DID, metadata, hash tài liệu gốc, v.v.
- Smart contract sẽ tạo NFT chứng chỉ, gắn với DID của người dùng, lưu trên blockchain. Người dùng có thể kiểm tra, xác thực NFT này qua bất kỳ client nào (Telegram, web, mobile) bằng DID của mình.
- Các nghiệp vụ khác (tuyển sinh, thanh toán, nghiên cứu...) cũng sử dụng DID này để liên kết dữ liệu, xác thực quyền sở hữu, truy xuất lịch sử giao dịch.

**Ví dụ luồng client Telegram mint NFT chứng chỉ:**
1. Người dùng nhắn tin với bot Telegram, xác thực tài khoản (qua OTP, liên kết ví, hoặc xác thực Telegram ID).
2. Hệ thống backend ánh xạ Telegram user với DID (tạo mới hoặc lấy DID đã có).
3. Khi người dùng hoàn thành nhiệm vụ (minigame, học tập, nhận chứng chỉ...), backend xác thực điều kiện và gửi lệnh mint NFT chứng chỉ lên smart contract, truyền vào DID và metadata.
4. NFT chứng chỉ được tạo, gắn với DID của user, lưu trên blockchain. Backend gửi thông báo về Telegram (qua bot) kèm link kiểm tra NFT, hoặc hướng dẫn kiểm tra trên web/app.
5. Người dùng có thể dùng DID để xác thực, chuyển nhượng, hoặc sử dụng NFT chứng chỉ cho các nghiệp vụ khác trong hệ sinh thái.

**Vai trò của mint NFT chứng chỉ trong hệ thống:**
- Đảm bảo tính xác thực, minh bạch, chống làm giả chứng chỉ.
- Cho phép xác thực nhanh qua blockchain, không cần liên hệ thủ công với đơn vị cấp.
- Dễ dàng tích hợp với các hệ thống tuyển sinh, việc làm, học bổng, v.v.
- Có thể chuyển nhượng, lưu trữ lâu dài, hoặc dùng làm điều kiện tham gia các hoạt động khác (minigame, tuyển sinh, nhận thưởng).

**Quy trình mint NFT chứng chỉ:**
1. Backend/Node xác thực điều kiện cấp chứng chỉ (ví dụ: hoàn thành khóa học, đạt thành tích, được trường xác nhận).
2. Backend gửi lệnh mint tới smart contract (educert), truyền vào thông tin định danh, metadata, hash tài liệu gốc.
3. Smart contract tạo NFT mới, lưu thông tin lên blockchain, trả về ID NFT và thông tin liên quan.
4. NFT chứng chỉ được gửi vào ví của người dùng, có thể kiểm tra, xác thực công khai.

Mint NFT chứng chỉ là một phần quan trọng trong hệ sinh thái, có thể kết hợp với các hoạt động minigame, nhận thưởng, hoặc các nghiệp vụ giáo dục khác.

#### 3.5.2. Quy trình minigame, nhận thưởng, mint NFT

**Quy trình và luồng API minigame, nhận thưởng, mint NFT:**

- **Tần suất gọi API và thời điểm nhận thưởng khi mint**
  - **Tần suất gọi API:**
    - Ứng dụng web/minigame chỉ gọi API mint một lần cho mỗi sự kiện đủ điều kiện nhận thưởng (ví dụ: hoàn thành minigame, đạt thành tích, nhận chứng chỉ). Không cần gọi liên tục hay giữ kết nối lâu dài. Nếu người dùng liên tục thực hiện các sự kiện đủ điều kiện (ví dụ: chơi nhiều ván minigame), mỗi lần hoàn thành sẽ gọi API một lần tương ứng.
    - Việc gọi API liên tục (spam) sẽ bị backend kiểm soát bằng các cơ chế xác thực, chống gian lận, rate limit.
  - **Thời điểm nhận thưởng:**
    - Người dùng sẽ nhận được NFT và token thưởng (eVND) ngay sau khi backend xác thực thành công và thực hiện mint. Thông thường, phản hồi API sẽ trả về trạng thái thành công và thông tin phần thưởng ngay lập tức (real-time), giúp tăng trải nghiệm người dùng.
    - Hệ thống cũng có thể cấu hình chế độ nhận thưởng ngẫu nhiên (ví dụ: minigame random reward), khi đó backend sẽ quyết định xác suất nhận thưởng và trả kết quả trong phản hồi API.

  **Tóm lại:**
  - Mỗi sự kiện đủ điều kiện chỉ cần gọi API mint một lần.
  - Người dùng nhận thưởng ngay sau khi API trả về thành công, hoặc theo logic random nếu ứng dụng thiết kế như vậy.

  1. **Người dùng truy cập ứng dụng web/minigame**: Đăng nhập bằng ví (hoặc liên kết ví eVND).
  2. **Thực hiện hành động đủ điều kiện nhận thưởng**: Ví dụ hoàn thành minigame, đạt thành tích học tập, hoặc nhận chứng chỉ số.
  3. **Frontend gửi yêu cầu mint tới Webservice (Node)**:
     - Gọi API RESTful, ví dụ:
       ```http
       POST /api/mint
       {
         "wallet_address": "evnd1xyz...",
         "event": "minigame_win",
         "metadata": { ... }
       }
       ```
  4. **Node xác thực và xử lý**:
     - Kiểm tra điều kiện, xác thực ví, ghi nhận sự kiện.
     - Mint NFT lên blockchain (CosmWasm smart contract).
     - Tự động chuyển thưởng stablecoin (eVND) vào ví người dùng thông qua smart contract hoặc tích hợp với hệ thống eVND.
     - **Lợi ích cho node khi nhiều người tham gia mint:**
       - **Phí giao dịch và vốn khởi tạo:** Để thực hiện mint hoặc tham gia minigame, người dùng cần có sẵn eVND trong ví để trả phí giao dịch. Nếu là người dùng mới, hệ thống có thể áp dụng một số cơ chế:
         - **Cấp vốn khởi tạo (airdrop):** Tặng một lượng eVND nhỏ cho tài khoản mới để họ có thể bắt đầu trải nghiệm.
         - **Nhiệm vụ miễn phí:** Thiết kế các nhiệm vụ, minigame hoặc sự kiện không yêu cầu phí giao dịch cho lần đầu, giúp người dùng nhận được eVND trước khi tham gia các hoạt động trả phí.
         - **Nạp eVND từ bên ngoài:** Người dùng có thể nạp eVND vào ví từ các nguồn khác (mua, chuyển khoản, nhận từ bạn bè, đối tác...).
         - **Nhận eVND qua các nhiệm vụ, hoạt động cộng đồng:**
           - **Tham gia, tương tác mạng xã hội:** Người dùng thực hiện các nhiệm vụ như truy cập website đối tác, like/share bài viết Facebook, follow fanpage, tham gia group, đăng bài, comment, hoặc chia sẻ nội dung về dự án lên mạng xã hội. Hệ thống tích hợp API xác thực (Facebook, Google, Twitter, v.v.) để kiểm tra kết quả và tự động thưởng eVND vào ví.
           - **Đóng góp ý kiến, phản hồi:** Người dùng gửi feedback, đánh giá, góp ý cho sản phẩm, hoặc tham gia khảo sát, poll, hệ thống xác thực thông tin và thưởng eVND.
           - **Đóng góp nội dung, sáng tạo:** Viết bài, tạo video, thiết kế hình ảnh, chia sẻ tài liệu, hoặc đóng góp nội dung hữu ích cho cộng đồng. Sau khi được kiểm duyệt hoặc đạt đủ lượt tương tác, hệ thống sẽ thưởng eVND.
           - **Giới thiệu bạn bè (referral):** Người dùng mời bạn bè đăng ký, sử dụng dịch vụ, khi bạn bè hoàn thành các điều kiện (đăng ký, xác thực, thực hiện nhiệm vụ đầu tiên), cả hai sẽ nhận được eVND thưởng.
           - **Tham gia sự kiện, minigame, thử thách:** Tham gia các sự kiện online/offline, minigame, giải đấu, hackathon, hoặc các thử thách do hệ thống/tổ chức đối tác phát động, hoàn thành nhiệm vụ sẽ nhận eVND.
           - **Tham gia học tập, thi cử, đào tạo:** Hoàn thành khóa học, vượt qua bài kiểm tra, đạt thành tích học tập, nhận chứng chỉ, v.v. đều có thể nhận eVND thưởng.
           - **Tham gia khảo sát, nghiên cứu thị trường:** Thực hiện khảo sát, trả lời bảng hỏi, đóng góp dữ liệu nghiên cứu, hệ thống xác thực và thưởng eVND.
         - **Cơ chế xác thực nhiệm vụ:**
           - Hệ thống tích hợp các API xác thực (OAuth, webhook, tracking link, chụp màn hình, kiểm duyệt thủ công hoặc AI) để đảm bảo người dùng thực sự hoàn thành nhiệm vụ.
           - Sau khi xác thực thành công, backend sẽ tự động gọi smart contract hoặc API để chuyển eVND vào ví người dùng.
         - **Mở rộng tích hợp đối tác:** Các tổ chức, doanh nghiệp, trường học có thể tích hợp API của VietEduChain để tự động thưởng eVND cho người dùng khi hoàn thành các nhiệm vụ, sự kiện, hoặc đóng góp cho hệ sinh thái.
       - **Cảnh báo hao hụt số dư:** Nếu người dùng chỉ thực hiện các giao dịch mint (trả phí) mà không nhận được phần thưởng hoặc không có hoạt động sinh lời, số dư eVND trong ví sẽ giảm dần do bị trừ phí giao dịch mỗi lần mint. Để duy trì hoặc tăng số dư, người dùng cần tham gia các hoạt động có phần thưởng đủ lớn hoặc nhận eVND từ các nguồn khác.
       - **Nguồn eVND trả thưởng:** Số eVND node dùng để trả thưởng cho người dùng phải được nạp trước vào ví node/smart contract (từ nhà phát hành, quỹ dự án, hoặc các nguồn khác). Node không nhận lại được số eVND này từ phí giao dịch.
       - **Thời điểm nhận phí:** Node nhận phí giao dịch ngay khi giao dịch được xác thực thành công trên blockchain (trước hoặc cùng lúc với khi client nhận NFT/phần thưởng).
      - **Lưu ý về động lực và giá trị nhận lại cho client:**
        - Nếu client chỉ trả phí giao dịch eVND để mint NFT hoặc nhận thưởng mà phần thưởng cũng chỉ là eVND (và số eVND thưởng ≤ phí đã trả), người dùng sẽ không có động lực tham gia lâu dài vì luôn bị hao hụt.
        - Để đảm bảo hấp dẫn, hệ thống cần:
          - Phần thưởng phải có giá trị thực tế: NFT, vật phẩm game, huy hiệu, quyền lợi, cơ hội đổi quà, tham gia sự kiện, tích điểm, hoặc có thể giao dịch/chuyển nhượng (nếu thiết kế cho phép).
          - Số eVND thưởng nên lớn hơn hoặc bằng phí giao dịch, hoặc có các nhiệm vụ miễn phí/airdrop cho người mới để không bị âm quỹ.
          - NFT/vật phẩm nhận được phải có giá trị sử dụng thực tế trong hệ sinh thái (đổi quà, tích điểm, tham gia hoạt động, bán lại...).
        - Tóm lại, client cần nhận được giá trị thực ngoài số eVND đã bỏ ra để tạo động lực tham gia, phát triển cộng đồng và giữ chân người dùng. Hệ thống nên thiết kế các luồng nhiệm vụ, minigame, sự kiện, phần thưởng đa dạng để đảm bảo lợi ích cho cả client và node.
       - **Rủi ro lỗ quỹ:** Nếu tổng phí giao dịch thu được nhỏ hơn số eVND node trả thưởng, node sẽ bị âm quỹ và không thể tiếp tục trả thưởng. Để tránh lỗ, cần thiết kế phí giao dịch đủ lớn hoặc có cơ chế bổ sung quỹ cho node.
       - **Tăng hoạt động, tăng uy tín:** Node có nhiều giao dịch, nhiều người dùng sẽ được đánh giá là node hoạt động tích cực, có thể nhận thêm phần thưởng từ hệ thống (staking reward, incentive).
       - **Cơ hội nhận phần thưởng hệ thống:** Một số blockchain có cơ chế chia sẻ phần thưởng (block reward, inflation reward) cho các node tích cực xác thực giao dịch, giúp node kiếm thêm token ngoài phí giao dịch.
     - **Tóm lại:** Node có thể kiếm được token từ phí giao dịch của người dùng khi mint, từ phần thưởng hệ thống, và từ việc tăng uy tín trong mạng lưới. Việc nhiều người tham gia sẽ giúp node vận hành có động lực duy trì và phát triển dịch vụ.
  5. **Gửi phản hồi về frontend**:
     - Thông báo mint thành công, NFT đã được gửi vào ví, đồng thời hiển thị số eVND vừa nhận được.
  6. **Người dùng kiểm tra ví**:
     - NFT và eVND xuất hiện trong ví, có thể sử dụng, chuyển nhượng hoặc đổi quà.

  **Lợi ích:**
  - Người dùng không cần vận hành node, chỉ cần ví là có thể nhận thưởng.
  - Tăng động lực tham gia hệ sinh thái, thúc đẩy tương tác và phát triển cộng đồng.

- **Mint các loại token khác**: Ngoài NFT chứng chỉ, hệ thống còn có thể mint nhiều loại token khác phục vụ các mục đích khác nhau:
    - **NFT vật phẩm ảo**: Dùng cho các minigame, phần thưởng, quà tặng trong hệ sinh thái giáo dục (ví dụ: huy hiệu, vật phẩm sưu tầm, vé sự kiện).
    - **Token phần thưởng (fungible token)**: Hệ thống có thể phát hành các token thưởng (ví dụ: stablecoin eVND, điểm thưởng, credit) cho người dùng khi tham gia các hoạt động như học tập, thi đua, sáng tạo nội dung, hoặc hoàn thành nhiệm vụ trên các ứng dụng tích hợp (web, mobile, bot Telegram).
    - **NFT xác thực thành tích**: Mint NFT cho các thành tích đặc biệt, giải thưởng, hoặc chứng nhận kỹ năng chuyên biệt.

- **Tính mở rộng**: Việc mint token (NFT hoặc fungible token) hoàn toàn có thể mở rộng cho các dịch vụ, ứng dụng mới trong tương lai, giúp hệ sinh thái luôn năng động và sáng tạo.


### 3.6. So sánh và liên hệ với các hệ thống hiện có

Kiến trúc API mở của VietEduChain lấy cảm hứng và có nhiều điểm tương đồng với các hệ sinh thái blockchain lớn trên thế giới, nhưng cũng có những điểm khác biệt nổi bật:

- **So sánh với Ethereum & BNB Chain:**
  - Các hệ thống như Ethereum, BNB Chain cung cấp API RPC/Web3 cho phép các DApp, ví, bot truy cập dữ liệu và gửi giao dịch. Tuy nhiên, việc tích hợp thường đòi hỏi hiểu biết sâu về blockchain, phí giao dịch cao, và không tối ưu cho các ứng dụng giáo dục hoặc minigame quy mô nhỏ.
  - VietEduChain sử dụng FastAPI để cung cấp các API RESTful thân thiện, dễ tích hợp cho cả web, mobile, bot Telegram, giúp giảm rào cản kỹ thuật cho người dùng phổ thông.

- **So sánh với các nền tảng như Flow, Polygon, Solana:**
  - Các nền tảng này cũng hỗ trợ NFT, minigame, phần thưởng token, nhưng chủ yếu tập trung vào lĩnh vực game hoặc DeFi. Việc tích hợp các dịch vụ giáo dục, xác thực định danh, và escrow học phí chưa được tối ưu.
  - VietEduChain thiết kế các smart contract chuyên biệt cho giáo dục (DID, credential, admission, escrow, research ledger), đồng thời vẫn hỗ trợ các dịch vụ gia tăng như minigame, vật phẩm ảo.

- **So sánh với OpenSea, Magic Eden (NFT Marketplace):**
  - Các marketplace này cung cấp API cho việc mint, giao dịch NFT, nhưng không tích hợp sâu với nghiệp vụ giáo dục, không hỗ trợ phần thưởng token stablecoin cho hoạt động học tập.
  - VietEduChain cho phép mint NFT chứng chỉ, vật phẩm ảo, và thưởng trực tiếp stablecoin (eVND) cho người dùng thông qua API.

- **So sánh với các hệ thống LMS truyền thống (Moodle, Canvas):**
  - Các LMS truyền thống cung cấp API cho quản lý bài giảng, điểm số, nhưng không có cơ chế phần thưởng token, NFT, hoặc tích hợp blockchain.
  - VietEduChain kết hợp LMS, blockchain, phần thưởng token, NFT và các dịch vụ gia tăng trên cùng một nền tảng.

**Tóm lại:**
VietEduChain không chỉ cung cấp API blockchain truyền thống mà còn mở rộng ra các API RESTful thân thiện, dễ tích hợp, hỗ trợ nhiều loại ứng dụng (web, mobile, bot), đồng thời tối ưu cho nghiệp vụ giáo dục và các dịch vụ gia tăng, tạo nên lợi thế cạnh tranh so với các hệ thống hiện có trên internet.
- Sử dụng Docker multi-stage build để tối ưu image backend.
- Quản lý các service bằng docker-compose, dễ dàng mở rộng và tích hợp CI/CD.
- Hỗ trợ mount mã nguồn backend để phát triển nhanh.


## 4. Quy trình build & deploy

Quy trình build & deploy backend VietEduChain sử dụng Docker multi-stage build, docker-compose và các script tự động hóa để đảm bảo môi trường đồng nhất, dễ mở rộng, dễ phát triển và vận hành:

### 4.1. Build image backend đa tầng (multi-stage)
- Sử dụng Dockerfile (Go, Rust, Python) để build các binary cần thiết:
  - Build `libwasmvm.so` (CosmWasm VM) phù hợp kiến trúc máy chủ.
  - Build `wasmd` từ source (Cosmos SDK v0.40.0, wasmvm v1.2.4).
  - Cài đặt Python 3, FastAPI, uvicorn, httpx, pydantic, pymongo, orjson, minio client, các thư viện backend.
  - Tạo virtualenv cho backend Python, đảm bảo môi trường cô lập.
- Tối ưu image cuối cùng chỉ chứa các binary, thư viện và mã nguồn cần thiết, giảm dung lượng, tăng bảo mật.

### 4.2. Khởi tạo dịch vụ bằng docker-compose
- Sử dụng file `docker-compose.v124.yml` để khởi tạo đồng thời các service:
  - `wasm-node`: Chạy blockchain node (wasmd), backend FastAPI, mount mã nguồn backend để phát triển nhanh.
  - `minio`: Chạy object storage MinIO, phục vụ lưu trữ dữ liệu lớn, metadata, file động.
- Cấu hình các biến môi trường: địa chỉ contract, endpoint MinIO, thông tin chain, thông số khởi tạo.
- Expose các port: 26656 (P2P), 26657 (RPC), 1317 (Cosmos REST), 1318 (FastAPI), 9090 (gRPC), 9000/9001 (MinIO).
- Mount volume dữ liệu blockchain, script khởi động, mã nguồn backend vào container.

### 4.3. Script khởi động tự động hóa (enhanced_start_v124.sh)
- Kiểm tra/cấu hình biến môi trường, kiểm tra thư viện, binary cần thiết.
- Nếu `CLEAN_START=true`, xóa dữ liệu cũ, khởi tạo lại chain (init genesis, tạo validator, add account, gentx, collect-gentxs).
- Tự động chỉnh sửa config (CORS, Prometheus, API, gas fee).
- Đảm bảo MinIO bucket tồn tại, tự động tạo nếu chưa có.
- Cài đặt và khởi động FastAPI backend (tự động tạo main.py, requirements.txt nếu thiếu, cài package, chạy uvicorn trên port 1318, log ra file).
- Giám sát tiến trình FastAPI, tự động restart nếu bị lỗi hoặc dừng đột ngột.
- Khởi động node wasmd với các tham số phù hợp, log ra file, kiểm tra PID.
- Nếu có script monitor_services.sh, tự động chạy để giám sát toàn bộ dịch vụ.

### 4.4. Quy trình phát triển nhanh (dev hot reload)
- Mount mã nguồn backend Python vào container, cho phép sửa code và reload API mà không cần rebuild image.
- Có thể mount script, file cấu hình, dữ liệu test để phát triển linh hoạt.

### 4.5. Theo dõi log, kiểm tra sức khỏe, tự động phục hồi
- Log FastAPI, wasmd, monitor ra các file riêng biệt trong container, dễ dàng kiểm tra bằng lệnh tail hoặc docker logs.
- Script giám sát kiểm tra tiến trình FastAPI, wasmd, tự động restart nếu phát hiện lỗi hoặc dừng bất thường.
- Healthcheck MinIO tích hợp sẵn trong docker-compose, đảm bảo storage luôn sẵn sàng.

**Tóm lại:**
Toàn bộ quy trình build & deploy backend VietEduChain được tự động hóa, đảm bảo môi trường đồng nhất, dễ mở rộng, dễ phát triển và vận hành. Chỉ cần chạy `docker-compose up -d` là có thể khởi tạo đầy đủ blockchain node, backend API, object storage, sẵn sàng tích hợp với frontend và các dịch vụ khác.

## 5. Ưu điểm kỹ thuật
- **Permissioned blockchain**: Kiểm soát truy cập, phù hợp nghiệp vụ giáo dục.
- **Modular**: Dễ dàng mở rộng thêm smart contract, API mới.
- **Tích hợp lưu trữ phi tập trung**: MinIO cho phép lưu trữ dữ liệu lớn, an toàn.
- **Dev-friendly**: Hỗ trợ mount mã nguồn, hot reload backend.
- **Bảo mật**: Sử dụng các phiên bản mới, cập nhật dependencies, tách biệt môi trường.

## 6. Sơ đồ triển khai (mô tả)
```
[User FE] <-> [Next.js FE] <-> [FastAPI BE] <-> [Cosmos wasmd] <-> [MinIO Storage]
```
- Người dùng truy cập FE, gửi yêu cầu tới BE (FastAPI), BE tương tác với blockchain (wasmd) và lưu trữ (MinIO).

Dưới đây là một số khó khăn, thách thức kỹ thuật hiện tại mà dự án đang gặp phải:

## 7. Khó khăn và thách thức kỹ thuật

### 7.1. Khởi tạo smart contract trên server
- Hiện tại quá trình khởi tạo, deploy smart contract CosmWasm trên máy chủ server gặp lỗi, nghi ngờ do xung đột version framework (Rust, CosmWasm, wasmd, toolchain...).
- Vấn đề này thường gặp khi môi trường build không đồng nhất, các dependency hoặc version không tương thích (ví dụ: version Rust, CosmWasm, wasmd, cargo, libc, v.v.).
- Dự kiến sẽ khắc phục bằng cách chuẩn hóa môi trường build (Docker, version lock, CI/CD), tham khảo tài liệu chính thức và cộng đồng hỗ trợ.
- Rất mong nhận được thêm hỗ trợ kỹ thuật từ cộng đồng, hội đồng chuyên gia để tối ưu quy trình build, deploy contract.

### 7.2. Tích hợp stablecoin eVND trên Cosmos SDK
- Cosmos SDK/wasmd mặc định hỗ trợ các token chuẩn public như ATOM, các token IBC, hoặc các token phát hành theo module bank, CW20 (CosmWasm).
- Tuy nhiên, Cosmos SDK không hỗ trợ native stablecoin như eVND theo kiểu "fiat-backed" hoặc "algorithmic stablecoin" như trên Ethereum (USDT, USDC, DAI), Tron, BNB Chain.
- Để tích hợp eVND, dự án phải tự phát hành token chuẩn CW20 (CosmWasm) hoặc xây dựng module riêng, đồng thời cần có cơ chế đảm bảo giá trị ổn định (backing, oracle, quỹ dự trữ, kiểm toán...).
- Việc kết nối, chuyển đổi, hoặc tích hợp eVND với các hệ sinh thái khác (Ethereum, Tron, v.v.) cũng gặp khó khăn do khác biệt về chuẩn token, bridge, và quy định pháp lý.
- Rất mong nhận được sự hỗ trợ kỹ thuật, tư vấn từ hội đồng chuyên gia về stablecoin, tokenomics, và tích hợp liên chuỗi để đảm bảo eVND vận hành an toàn, minh bạch.

### 7.3. Giải thích về gas fee và phân biệt với token hệ thống
- **Gas fee** là khoản phí bắt buộc khi thực hiện giao dịch trên blockchain (gửi token, mint NFT, gọi smart contract...). Phí này trả cho node xác thực để bù chi phí vận hành, bảo mật mạng lưới.
- Trên Cosmos SDK, gas fee thường được thanh toán bằng token gốc của chain (ví dụ: ATOM, hoặc token staking của chain custom). Nếu hệ thống phát hành eVND (CW20), cần cấu hình cho phép dùng eVND làm fee hoặc phải chuyển đổi sang token gốc để trả phí.
- **Phân biệt gas fee và token hệ thống:**
  - **Gas fee** là chi phí kỹ thuật để xác thực, ghi nhận giao dịch lên blockchain, không phải phần thưởng hay giá trị sử dụng trực tiếp.
  - **Token hệ thống (eVND, NFT, reward token, v.v.)** là tài sản số dùng để trao đổi, thưởng, thanh toán trong hệ sinh thái. Người dùng có thể nhận, chuyển nhượng, sử dụng token này cho các dịch vụ, nhiệm vụ, phần thưởng.
- **Nhầm lẫn thường gặp:**
  - Một số người dùng nhầm lẫn gas fee là "phí dịch vụ" hoặc "phí chuyển khoản" của hệ thống, nhưng thực chất đây là chi phí bắt buộc của blockchain, không thuộc về dự án mà thuộc về node xác thực.
  - Token eVND dùng để trả phí giao dịch (nếu được cấu hình) nhưng đồng thời cũng là phần thưởng, phương tiện thanh toán trong hệ sinh thái. Cần phân biệt rõ mục đích sử dụng để tránh hiểu nhầm.

**Tóm lại:**
- Dự án đang gặp khó khăn về môi trường build smart contract và tích hợp stablecoin eVND trên Cosmos SDK.
- Gas fee là chi phí kỹ thuật bắt buộc, khác với token phần thưởng/tiện ích trong hệ thống.
- Rất mong nhận được sự hỗ trợ kỹ thuật, tư vấn từ hội đồng chuyên gia và cộng đồng để hoàn thiện hệ thống.

## 8. Kết luận
Dự án VietEduChain cung cấp nền tảng blockchain permissioned hiện đại, tích hợp đầy đủ backend, frontend, lưu trữ phi tập trung, phù hợp triển khai các nghiệp vụ giáo dục số hóa, minh bạch và an toàn.


---

## 9. Các câu hỏi thường gặp về "mint NFT chứng chỉ" (FAQ)

### 1. Mint NFT chứng chỉ là gì? Có khác gì với cấp chứng chỉ số truyền thống?
**Trả lời:**
Mint NFT chứng chỉ là quá trình tạo ra một token không thể thay thế (NFT) trên blockchain, đại diện cho một chứng chỉ số duy nhất. Khác với chứng chỉ số truyền thống (file PDF, QR code, bản in...), NFT chứng chỉ không thể làm giả, không thể chỉnh sửa, có thể xác thực nguồn gốc, lịch sử giao dịch công khai trên blockchain, và gắn liền với định danh phi tập trung (DID) của người sở hữu.

### 2. Ai có thể mint NFT chứng chỉ? Quy trình diễn ra như thế nào?
**Trả lời:**
Tổ chức/trường học hoặc hệ thống backend có quyền cấp chứng chỉ sẽ thực hiện mint NFT chứng chỉ cho người dùng khi đủ điều kiện (hoàn thành khóa học, đạt thành tích, được xác nhận...). Quy trình gồm: xác thực điều kiện, gửi lệnh mint tới smart contract, truyền vào DID và metadata, smart contract tạo NFT và gắn với ví/DID của người nhận.

### 3. NFT chứng chỉ lưu trữ những thông tin gì? Có bảo mật không?
**Trả lời:**
NFT chứng chỉ lưu các thông tin: tên chứng chỉ, loại, ngày cấp, đơn vị cấp, hash tài liệu gốc, metadata liên quan, liên kết DID của người nhận. Dữ liệu nhạy cảm (file scan, thông tin cá nhân) chỉ lưu hash hoặc reference trên blockchain, còn file thực tế lưu trên MinIO (object storage) để đảm bảo bảo mật và tiết kiệm chi phí.

### 4. Làm sao để xác thực một NFT chứng chỉ là thật?
**Trả lời:**
Bất kỳ ai cũng có thể kiểm tra NFT chứng chỉ trên blockchain bằng ID NFT hoặc DID của người nhận. Thông tin về đơn vị cấp, ngày cấp, hash tài liệu gốc, lịch sử giao dịch đều công khai, không thể chỉnh sửa. Có thể tích hợp API xác thực vào website, app, hoặc kiểm tra trực tiếp trên explorer blockchain.

### 5. Nếu mất ví hoặc quên DID thì có lấy lại được NFT chứng chỉ không?
**Trả lời:**
Nếu người dùng mất quyền truy cập ví/DID, việc khôi phục NFT chứng chỉ phụ thuộc vào chính sách của đơn vị cấp và hệ thống. Có thể hỗ trợ chuyển nhượng lại NFT sang ví mới sau khi xác minh danh tính, hoặc mint lại NFT mới và thu hồi NFT cũ. Tuy nhiên, người dùng cần bảo quản kỹ thông tin ví/DID để tránh mất mát.

### 6. NFT chứng chỉ có thể chuyển nhượng, bán, hoặc sử dụng cho mục đích khác không?
**Trả lời:**
Tùy vào thiết kế smart contract, NFT chứng chỉ có thể cho phép chuyển nhượng hoặc không. Đa số chứng chỉ học tập sẽ không cho phép chuyển nhượng để đảm bảo tính xác thực. Tuy nhiên, NFT có thể dùng làm điều kiện tham gia tuyển sinh, nhận học bổng, hoặc tích hợp với các dịch vụ khác trong hệ sinh thái.

### 7. Phí mint NFT chứng chỉ là ai trả? Có tốn nhiều chi phí không?
**Trả lời:**
Phí mint NFT là phí giao dịch blockchain (gas fee), thường do tổ chức cấp hoặc người nhận trả, tùy vào chính sách. Trên VietEduChain, phí này được tối ưu thấp, có thể miễn phí cho người dùng mới (airdrop), hoặc tích hợp vào học phí/dịch vụ. Phí mint giúp đảm bảo mạng lưới vận hành an toàn, chống spam.

### 8. NFT chứng chỉ có thể dùng để xác thực ở đâu? Có được công nhận rộng rãi không?
**Trả lời:**
NFT chứng chỉ có thể xác thực trên bất kỳ hệ thống nào tích hợp API blockchain, từ website trường học, đối tác tuyển dụng, đến các nền tảng học tập, việc làm. Việc công nhận rộng rãi phụ thuộc vào sự hợp tác giữa các tổ chức, tiêu chuẩn kỹ thuật, và sự phổ biến của nền tảng blockchain sử dụng.

### 9. Nếu blockchain bị tấn công hoặc dừng hoạt động thì NFT chứng chỉ có bị mất không?
**Trả lời:**
Blockchain permissioned như VietEduChain được thiết kế để đảm bảo an toàn, phân tán, chống tấn công. Dữ liệu NFT được lưu trên nhiều node, rất khó bị mất hoặc chỉnh sửa. Ngoài ra, hệ thống có thể backup dữ liệu, lưu hash trên nhiều chain, hoặc tích hợp giải pháp phục hồi để đảm bảo an toàn lâu dài.

### 10. NFT chứng chỉ có thể tích hợp với các hệ thống khác (LMS, tuyển sinh, việc làm...) không?
**Trả lời:**
Có. NFT chứng chỉ được thiết kế chuẩn hóa (CW721, metadata mở), dễ dàng tích hợp với các hệ thống quản lý học tập (LMS), tuyển sinh, việc làm, học bổng, hoặc các dịch vụ xác thực khác qua API, webhook, hoặc liên kết DID.
