# DỰ ÁN EDUCHAIN

## TỔNG QUAN

EduChain là một dự án blockchain được xây dựng trên nền tảng Cosmos SDK, được thiết kế để hỗ trợ các quy trình giáo dục thông qua các ứng dụng phi tập trung và hợp đồng thông minh. Dự án nhằm nâng cao tính minh bạch, bảo mật và hiệu quả trong các hoạt động giáo dục, bao gồm cấp chứng chỉ, quản lý danh tính, xử lý thanh toán, tính toàn vẹn trong nghiên cứu và minh bạch trong tuyển sinh.

## MỤC TIÊU VÀ PHẠM VI DỰ ÁN

### Mục tiêu tổng quát

1. Xây dựng VietEduChain – chuỗi khối Layer-1 chuyên biệt cho giáo dục Việt Nam, đáp ứng đồng thời ba trụ cột:
2. Hiệu năng cấp hạ tầng: thông lượng ≥ 30.000 giao dịch/giây; thời gian hoàn tất ("finality") ≈ 1,2 giây; phí giao dịch < 0,1% giá trị.
3. Chuẩn dữ liệu quốc tế: hỗ trợ đầy đủ Verifiable Credential (VC) và Decentralized Identifier (DID) theo khuyến nghị W3C; sẵn sàng liên thông qua Inter-Blockchain Communication (IBC).
4. Phục vụ trọn chu trình giáo dục: từ cấp phát văn bằng, tuyển sinh, học phí, đến lưu vết nghiên cứu khoa học – bảo đảm minh bạch, an toàn dữ liệu và khả năng mở rộng lâu dài.

### Mục tiêu cụ thể

| Nhóm mục tiêu | Chỉ tiêu đến 2028 | Thước đo |
|---------------|-------------------|----------|
| Kỹ thuật | • TPS ≥ 30.000 (testnet T+12 tháng)<br>• Finality ≤ 1,5 s (mainnet T+18 tháng) | Kết quả benchmark độc lập; giám sát Prometheus |
| Triển khai | • 50+ cơ sở giáo dục tích hợp VC<br>• 5 validator cấp bộ/nghiệp đoàn | Hợp đồng tích hợp; danh sách validator on-chain |
| Tài chính | • ≥ 50.000 giao dịch học phí/giờ ở kỳ cao điểm<br>• Phí bình quân < 0,1 USD | Dashboard EduPay |
| Nghiên cứu | • 5.000 hồ sơ ResearchLedger<br>• Tỷ lệ đạo văn bị phát hiện giảm ≥ 50% | Hash đăng ký trên chain; thống kê Retraction Watch VN |
| Tuyển sinh | • 1 triệu Seat-NFT phát hành/mùa<br>• Khiếu nại điểm giảm ≥ 90% | Log EduAdmission; báo cáo Bộ GD-ĐT |

### Phạm vi dự án

| Hạng mục đưa vào phạm vi | Mô tả | Lý do |
|--------------------------|-------|-------|
| Lõi chuỗi (Core-Layer-1) | HotStuff-PoAA, DAG mempool, Block-STM, CosmWasm | Bảo đảm hiệu năng và khả năng mở rộng lâu dài |
| Năm mô-đun chức năng | EduCert • EduID • EduPay • ResearchLedger • EduAdmission | Bao phủ chu trình văn bằng-nghiên cứu-tài chính-tuyển sinh |
| Cổng API & SDK | REST/gRPC • GraphQL • JS/Flutter light-client | Tạo thuận lợi tích hợp LMS, cổng tuyển sinh, ví di động |
| Hạ tầng liên thông | IBC relay, ICS-20 stablecoin bridge, Cross-chain seat transfer | Kết nối "Internet of Blockchains", mở rộng ASEAN |
| Bộ công cụ giám sát & explorer | Prometheus + Grafana • BigDipper • Cosmos-Graph indexer | Minh bạch dữ liệu, đo KPI theo thời gian thực |
| Khung pháp lý & tuân thủ | PDPA Việt Nam 2023 • GDPR ánh xạ • Nghị định 13/2023 | Đảm bảo an toàn dữ liệu cá nhân, tương thích quốc tế |

## CẤU TRÚC DỰ ÁN

Dự án được tổ chức thành các thành phần chính sau:

- **Chain**: Ứng dụng blockchain cốt lõi được xây dựng bằng Cosmos SDK.
- **Smart Contracts**: Các hợp đồng thông minh CosmWasm cho các module EduChain khác nhau.

## SMART CONTRACTS (HƯỚNG DẪN)

### Tổng quan về Smart Contracts

Hệ thống bao gồm 5 module chính:

1. **EduID**: Quản lý danh tính số trong hệ thống giáo dục
2. **EduCert**: Cấp và xác minh văn bằng điện tử
3. **EduPay**: Thanh toán học phí và học bổng
4. **ResearchLedger**: Quản lý nghiên cứu và chống đạo văn
5. **EduAdmission**: Hệ thống tuyển sinh minh bạch

### Cấu trúc thư mục

```
/educhain
  /smart-contracts            # Mã nguồn các smart contract
    /eduid                    # Contract quản lý danh tính
    /educert                  # Contract văn bằng điện tử
    /edupay                   # Contract thanh toán học phí
    /researchledger           # Contract quản lý nghiên cứu
    /eduadmission             # Contract tuyển sinh
  /deployments                # Scripts và cấu hình triển khai
    /scripts                  # Scripts để build, deploy và tương tác
    /devnet                   # Dữ liệu cho môi trường phát triển
      /data                   # Lưu trữ địa chỉ contract và thông tin khác
```

### Cài đặt và triển khai

#### Bước 1: Cài đặt CosmWasm node

Chạy các lệnh sau để khởi động node CosmWasm:

```bash
# Khởi động Docker container với wasmd
docker run --rm -d --name wasm-node -p 26656:26656 -p 26657:26657 \
  -p 1317:1317 -e STAKE_TOKEN=stake -e UNSAFE_CORS=true \
  cosmwasm/wasmd:v0.50.0-patched /opt/run_wasmd.sh
```

#### Bước 2: Build các smart contract

Build tất cả các contract:

```bash
cd /path/to/educhain
chmod +x deployments/scripts/build_educhain_contracts.sh
./deployments/scripts/build_educhain_contracts.sh
```

Nếu gặp lỗi khi build, bạn có thể tạo các contract giả để thử nghiệm:

```bash
./deployments/scripts/manual_build_contracts.sh
```

#### Bước 3: Deploy các contract

Triển khai tất cả các contract lên blockchain:

```bash
chmod +x deployments/scripts/deploy_educhain_contracts.sh
./deployments/scripts/deploy_educhain_contracts.sh
```

Script này sẽ:
1. Tải lên các file WASM
2. Khởi tạo các contract với tham số thích hợp
3. Lưu địa chỉ contract vào thư mục `deployments/devnet/data`

#### Bước 4: Tương tác với các contract

Sử dụng script tương tác để thử các chức năng:

```bash
chmod +x deployments/scripts/interact_with_contracts.sh
./deployments/scripts/interact_with_contracts.sh
```

### Chi tiết các module

#### EduID

Module quản lý danh tính dựa trên DID (Decentralized Identifiers), cho phép:
- Tạo danh tính số mới
- Truy vấn thông tin danh tính
- Cập nhật thông tin danh tính
- Xác thực danh tính

#### EduCert

Module quản lý văn bằng điện tử, hỗ trợ:
- Cấp văn bằng mới
- Xác minh tính chính xác của văn bằng
- Chia sẻ văn bằng với bên thứ ba
- Kiểm tra lịch sử thay đổi

#### EduPay

Module thanh toán học phí và học bổng:
- Tạo escrow thanh toán học phí
- Xác nhận đăng ký học
- Giải ngân học phí cho trường
- Quản lý học bổng

#### ResearchLedger

Module quản lý nghiên cứu khoa học:
- Đăng ký nghiên cứu mới
- Lưu trữ hash của tài liệu nghiên cứu
- Kiểm tra trùng lặp và đạo văn
- Quản lý quyền sở hữu trí tuệ

#### EduAdmission

Module quản lý tuyển sinh minh bạch:
- Đăng ký tuyển sinh
- Xác nhận kết quả
- Công bố điểm và thứ hạng
- Xác thực quy trình tuyển sinh

### Phát triển và mở rộng

#### Thêm chức năng mới

1. Sửa mã nguồn contract trong thư mục tương ứng
2. Build lại contract: `./deployments/scripts/build_educhain_contracts.sh`
3. Deploy lại contract: `./deployments/scripts/deploy_educhain_contracts.sh`

#### Khắc phục sự cố

##### Lỗi build contract

Nếu gặp lỗi khi build các contract:
1. Kiểm tra các phụ thuộc trong file Cargo.toml
2. Đảm bảo các phiên bản CosmWasm tương thích
3. Sử dụng `manual_build_contracts.sh` để tạo contract tạm thời

##### Lỗi deploy contract

Nếu gặp lỗi khi deploy:
1. Kiểm tra xem node CosmWasm đã chạy chưa
2. Kiểm tra file WASM đã được tạo đúng cách
3. Xem logs của container để tìm lỗi cụ thể

### Liên kết

- [Tài liệu CosmWasm](https://docs.cosmwasm.com)
- [Cấu trúc DID W3C](https://www.w3.org/TR/did-core/)
  - `app/`: Chứa logic ứng dụng cốt lõi.
  - `x/`: Các module mở rộng chức năng blockchain.
  - `proto/`: Định nghĩa protocol buffer cho giao tiếp giữa các module.
  - `Makefile`: Tự động hóa quá trình build cho ứng dụng blockchain.

- **Smart Contracts**: Các module được triển khai dưới dạng hợp đồng thông minh CosmWasm.
  - `eduid/`: Module hợp đồng thông minh cho EduID.
  - `educert/`: Module hợp đồng thông minh cho EduCert.
  - `edupay/`: Module hợp đồng thông minh cho EduPay.
  - `researchledger/`: Module hợp đồng thông minh cho ResearchLedger.
  - `eduadmission/`: Module hợp đồng thông minh cho EduAdmission.
  - `shared/`: Thư viện và giao diện được chia sẻ.

- **Deployments**: Cấu hình và script để triển khai blockchain.
  - `devnet/`: Cấu hình triển khai cho mạng phát triển.
  - `scripts/`: Script để triển khai và khởi tạo blockchain.

- **Clients**: SDK và API để tương tác với blockchain.
  - `ts-sdk/`: TypeScript SDK.
  - `flutter-sdk/`: Flutter SDK để tích hợp ví di động.
  - `graphql-gateway/`: API GraphQL tùy chọn.

- **IBC Relay**: Cấu hình và script cho giao tiếp giữa các blockchain (IBC).
- **Monitoring**: Công cụ giám sát blockchain sử dụng Prometheus và Grafana.
- **Explorer**: Ứng dụng frontend để khám phá dữ liệu blockchain.
- **Legal**: Tài liệu tuân thủ các tiêu chuẩn pháp lý.
- **Docs**: Thông số kỹ thuật và hướng dẫn.

## TÍNH NĂNG

- **Lớp Core**: Xây dựng trên đồng thuận HotStuff, DAG mempool và CosmWasm để đảm bảo khả năng mở rộng và hiệu suất.
- **Module Chức Năng**: Bao gồm EduCert, EduID, EduPay, ResearchLedger và EduAdmission để phục vụ các quy trình giáo dục khác nhau.
- **API & SDK**: REST/gRPC và GraphQL API, cùng với JS/Flutter SDK để dễ dàng tích hợp.
- **Khả Năng Tương Tác**: IBC relay và khả năng cross-chain để kết nối với các blockchain khác.
- **Công Cụ Giám Sát**: Prometheus và Grafana để minh bạch dữ liệu thời gian thực và theo dõi KPI.
- **Tuân Thủ Pháp Lý**: Tuân thủ các tiêu chuẩn PDPA Việt Nam 2023 và GDPR về bảo vệ dữ liệu.

## NGUYÊN TẮC THIẾT KẾ

- **Mở Ưu Tiên (Open-first)**: Ưu tiên phát triển mã nguồn mở với giấy phép tương thích Apache-2.0 hoặc GPL.
- **Khả Năng Tương Tác Trong Thiết Kế (Interoperability by design)**: Đảm bảo tất cả các module đều tương thích IBC và sử dụng tiêu chuẩn dữ liệu JSON-LD/VC.
- **Bảo Mật & Quyền Riêng Tư Mặc Định (Security & Privacy-by-default)**: Tích hợp Zero-Knowledge Proofs để tiết lộ có chọn lọc và mã hóa đầu cuối.
- **Hướng Người Dùng (User-centric)**: Trao quyền cho người dùng với danh tính tự chủ (SSI) và cơ chế khôi phục xã hội cho ví.

## HƯỚNG DẪN CÀI ĐẶT

### Cài Đặt Node Blockchain

Để cài đặt và vận hành node blockchain EduChain, vui lòng tham khảo hướng dẫn chi tiết trong thư mục `deployments/devnet/`.

Bạn có thể sử dụng một trong hai phương pháp sau:

1. **Sử dụng script (Khuyến nghị)**

   ```bash
   cd deployments/devnet
   chmod +x run_wasmd_node.sh
   ./run_wasmd_node.sh
   ```

2. **Sử dụng Docker Compose**

   ```bash
   cd deployments/devnet
   docker-compose up -d
   ```

### Tương Tác Với Blockchain

Sau khi cài đặt, bạn có thể tương tác với blockchain thông qua các API sau:

- **RPC API**: http://localhost:26657
- **REST API**: http://localhost:1317
- **gRPC**: http://localhost:9090

## TRIỂN KHAI HỢP ĐỒNG THÔNG MINH

Để triển khai hợp đồng thông minh lên blockchain, bạn có thể sử dụng script cung cấp:

```bash
cd deployments/scripts
./deploy_contract.sh ../smart-contracts/eduid
```

## TRIỂN KHAI LÊN SERVER

Khi triển khai VietEduChain lên môi trường server, vui lòng tuân thủ chính xác các bước sau theo thứ tự:

### Bước 1: Clone code repository

```bash
git clone https://github.com/yourusername/cosmos-permissioned-network.git
cd cosmos-permissioned-network/be/educhain
```

### Bước 2: Khởi tạo và chạy blockchain node

```bash
cd deployments/devnet
chmod +x run_wasmd_node.sh
./run_wasmd_node.sh
```

Lưu ý: Script này sẽ tạo một blockchain mới từ đầu với genesis block và validator node. Quá trình này có thể mất vài phút để hoàn tất.

### Bước 3: Build tất cả các smart contracts

```bash
cd ../scripts
chmod +x build_educhain_contracts.sh
./build_educhain_contracts.sh
```

Lưu ý: Quá trình build sẽ sử dụng Docker để tạo môi trường biên dịch Rust và tạo ra các file WASM tối ưu hóa.

### Bước 4: Triển khai smart contracts lên blockchain

```bash
chmod +x deploy_educhain_contracts.sh
./deploy_educhain_contracts.sh
```

Quá trình này sẽ:
- Upload file WASM lên blockchain
- Khởi tạo contract với các tham số ban đầu
- Cấp quyền quản trị cho các tài khoản được chỉ định

### Bước 5: Cập nhật địa chỉ contract trong cấu hình ứng dụng

Sau khi triển khai, địa chỉ của các contracts sẽ được lưu trong các files:

```bash
cat ../devnet/data/educert_address.txt
cat ../devnet/data/eduid_address.txt
cat ../devnet/data/edupay_address.txt
cat ../devnet/data/researchledger_address.txt
cat ../devnet/data/eduadmission_address.txt
```

Cập nhật các địa chỉ này vào cấu hình API gateway và ứng dụng frontend của bạn.

**Quan trọng**: Môi trường server sẽ KHÔNG tự động đồng bộ với môi trường phát triển cục bộ của bạn. Dữ liệu blockchain, trạng thái tài khoản và tương tác với contract từ môi trường phát triển cục bộ sẽ không có mặt trên server. Mỗi lần triển khai tạo ra một blockchain mới với trạng thái ban đầu.

## ĐÓNG GÓP

Chúng tôi rất hoan nghênh đóng góp của bạn! Vui lòng làm theo hướng dẫn trong tài liệu của dự án để đóng góp vào dự án EduChain.

## LIÊN HỆ HỖ TRỢ

Nếu bạn gặp bất kỳ vấn đề nào khi cài đặt hoặc sử dụng EduChain, vui lòng liên hệ với đội ngũ hỗ trợ kỹ thuật của chúng tôi:

- **Email hỗ trợ**: support@vieteduledger.vn
- **Kênh Discord**: [VietEduChain Discord](https://discord.gg/vieteduledger)
- **GitHub Issues**: Tạo issue trên repository chính thức của dự án

## LỜI CẢM ƠN

Dự án VietEduChain được phát triển với sự hỗ trợ từ cộng đồng Cosmos, CosmWasm và các đối tác giáo dục Việt Nam. Chúng tôi xin chân thành cảm ơn tất cả những người đã đóng góp và hỗ trợ dự án này.

## CÁC MÔ-ĐUN CHỨC NĂNG

Mỗi mô-đun dưới đây được cài đặt dưới dạng gói CosmWasm (smart-contract Rust) độc lập, gọi lẫn nhau qua thông điệp ("message") nội bộ và có thể nâng cấp phiên bản bằng cơ chế migrate của Cosmos SDK. Toàn bộ dữ liệu nhạy cảm (khóa, điểm số, tài liệu nghiên cứu) không ghi thô lên chuỗi; thay vào đó, chuỗi chỉ lưu băm một chiều (hash) và siêu dữ liệu (metadata).

### Quan hệ giữa các mô-đun

#### EduCert – Cấp & Thu hồi Văn bằng (Verifiable Credential)

| Thành phần | Mô tả |
|------------|-------|
| Issuer API | Cổng REST nhận Payload VC JSON-LD, ký số bằng khóa của trường; sinh Credential NFT (token ID = băm SHA-256). |
| Revocation Registry | Danh sách băm đã thu hồi; truy vấn is_revoked(hash) trả về boolean. |
| Viewer Portal | Ứng dụng web hiển thị VC; xác thực ->5 giây nhờ so khớp hash + chữ ký BLS của validator. |

**Chu trình:**
1. Trường Đại học gọi POST /edu-cert/issue → chuỗi ghi MsgIssueVC.
2. Sinh viên nhận QR VC lưu trong ví.
3. Nhà tuyển dụng quét QR → hợp đồng VerifyVC trả kết quả tức thì.

#### EduID – Danh tính tự chủ (Self-Sovereign Identity, SSI)

| Thành phần | Mô tả |
|------------|-------|
| DID Registry | Lưu trữ bản ghi DID-Document (khóa công khai, dịch vụ) ở dạng IPLD; băm ghi on-chain. |
| VC Wallet SDK | Thư viện Flutter / React cho ví di động; hỗ trợ Selective Disclosure bằng chứng ZK-CL (Zero-Knowledge Credential Logic). |
| Interop Bridge | Chuyển VC qua IBC đến chain khác (Cosmos Hub, Axelar). |

**Lợi ích:** Một DID duy nhất điều khiển mọi VC học tập, hỗ trợ "single-sign-on" với LMS.

#### EduPay – Thanh toán Học phí & Học bổng (Tuition Settlement)

| Thành phần | Mô tả |
|------------|-------|
| Stablecoin VNĐ (eVND) | Token "fiat-collateralised" phát hành bởi ngân hàng ủy quyền; chuẩn ICS-20 để di chuyển qua IBC. |
| Escrow Contract | Khoá hai bên (payer, school). Khi ProofOfEnrollment thành công, tiền tự động release. |
| Oracle VNĐ/USDC | Truy nguồn Band⸱Relay; cập nhật giá 15 s/lần, sai lệch ≤ 0,25%. |

**Chỉ số mục tiêu:** Thời gian chốt giao dịch < 5 s, phí < 0,1%.

#### ResearchLedger – Chống đạo văn & Ngụy tạo chứng cứ nghiên cứu

| Thành phần | Mô tả |
|------------|-------|
| Data Fingerprint | Lấy băm SHA-256 của bản PDF, bộ dữ liệu (.csv) hoặc Notebook; ghi MsgRegisterHash. |
| DOI-NFT | Mỗi lần xuất bản sinh NFT chứa DOI; siêu dữ liệu: cid, timestamp, authors. |
| Plagiarism Bounty | Hợp đồng "bounty pool" thưởng token RESEARCH cho người chứng minh đạo văn (nộp cặp hash trùng). |

**Tác động:** Giảm ≥ 80% thời gian đối sánh, nâng uy tín học thuật.

#### EduAdmission – Tuyển sinh Minh bạch (Admission Transparency)

| Thành phần | Mô tả |
|------------|-------|
| Seat-NFT | Mỗi chỉ tiêu = 1 NFT; trường ĐH mint trước mùa tuyển sinh; khi thí sinh xác nhận học, NFT burn. |
| Score Oracle | Kéo điểm thi THPT do Bộ GD-ĐT công bố; ghi MsgPushScore{ candidate_hash, score }. |
| Matching Engine | Smart-contract thực hiện thuật toán "Deferred-Acceptance" → danh sách trúng tuyển không thể chỉnh sửa. |

**Kết quả:** 100% log audit-able, khiếu nại "vênh chỉ tiêu" giảm > 90%.

#### EduMarket – Thị trường học liệu & Chứng chỉ khoá học (tuỳ chọn giai đoạn III)

- Cho phép giảng viên đúc (mint) Khoá Học-NFT (ERC-721 kiểu CosmWasm).
- Thanh toán bằng eVND qua EduPay; 2% phí giao dịch chuyển vào quỹ khuyến học on-chain.

## THÔNG TIN KÍCH THƯỚC CONTRACTS

Kích thước hiện tại của các contracts đã được tối ưu hóa:

| Contract | Kích thước (bytes) | Trạng thái |
|----------|-------------------|------------|
| educert | 226,859 | ✅ Đã tối ưu |
| edupay | 149,759 | ✅ Đã tối ưu |
| eduid | 155,441 | ✅ Đã tối ưu |
| researchledger | 158,669 | ✅ Đã tối ưu |
| eduadmission | 165,948 | ✅ Đã tối ưu |

## QUY TRÌNH TRIỂN KHAI SERVER TO SERVER

Khi cần triển khai từ server hiện tại sang server mới, cần thực hiện theo quy trình sau:

1. **Xuất trạng thái hiện tại**: Sử dụng công cụ export của wasmd để xuất trạng thái blockchain.

   ```bash
   wasmd export --home={NODE_HOME_DIR} > exported_state.json
   ```

2. **Chuyển file trạng thái**: Sao chép file exported_state.json sang server mới.

3. **Khởi động node mới với trạng thái đã xuất**:

   ```bash
   wasmd init --home={NEW_NODE_HOME_DIR}
   # Thay thế genesis.json bằng trạng thái đã xuất
   cp exported_state.json {NEW_NODE_HOME_DIR}/config/genesis.json
   # Khởi động node mới
   wasmd start --home={NEW_NODE_HOME_DIR}
   ```

4. **Xác minh tính đồng bộ**: Kiểm tra xem node mới đã đồng bộ đúng trạng thái bằng cách so sánh hash của block mới nhất.

   ```bash
   wasmd status | jq '.sync_info.latest_block_hash'
   ```

## YÊU CẦU HỆ THỐNG

### Server Yêu cầu tối thiểu

- **CPU**: 4 cores (8 cores đề xuất cho validator)
- **RAM**: 16GB (32GB đề xuất cho validator)
- **Lưu trữ**: 500GB SSD (1TB đề xuất cho lưu trữ dài hạn)
- **Băng thông**: 100Mbps (1Gbps đề xuất cho validator)
- **Hệ điều hành**: Ubuntu 20.04 LTS hoặc cao hơn

### Server Yêu cầu đề xuất cho môi trường Production

- **CPU**: 16+ cores
- **RAM**: 64GB+
- **Lưu trữ**: 2TB+ NVMe SSD
- **Băng thông**: 1Gbps với kết nối dự phòng
- **Hệ điều hành**: Ubuntu 22.04 LTS
- **Bảo mật**: HSM (Hardware Security Module) cho bảo vệ khóa validator