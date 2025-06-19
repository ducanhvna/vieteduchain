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

## API DOCUMENTATION

VietEduChain cung cấp các API RESTful để tương tác với hệ thống blockchain. Các API này hoạt động trên port 1317 và tuân theo tiêu chuẩn Cosmos SDK REST API.

> **Lưu ý**: Tài liệu API đầy đủ với các ví dụ định dạng phản hồi JSON có thể được tìm thấy trong file [api-docs.md](api-docs.md).

### Thông tin chung

- **Base URL**: `http://{server-address}:1317`
- **Content-Type**: `application/json`
- **Authentication**: Các giao dịch yêu cầu chữ ký. Có thể sử dụng tùy chọn `?generate_only=true` để tạo giao dịch trước khi ký.

### API Cơ sở (Cosmos SDK)

#### Thông tin Node

```
GET /cosmos/base/tendermint/v1beta1/node_info
```

Trả về thông tin về node, bao gồm ID, phiên bản và thông tin mạng.

### API Cosmos Core

#### Thông tin Tài khoản

```
GET /cosmos/auth/v1beta1/accounts/{address}
```

#### Số dư Tài khoản

```
GET /cosmos/bank/v1beta1/balances/{address}
```

#### Gửi Token

```
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

### API CosmWasm

#### Danh sách Contracts

```
GET /cosmwasm/wasm/v1/code
```

Trả về danh sách tất cả các mã contract đã được tải lên blockchain.

#### Chi tiết Contract

```
GET /cosmwasm/wasm/v1/code/{code_id}
```

Trả về thông tin chi tiết về một contract code cụ thể.

#### Truy vấn Trạng thái Contract

```
GET /cosmwasm/wasm/v1/contract/{contract_address}/smart/{query_data}
```

Thực hiện truy vấn thông minh đến contract, trong đó `query_data` là dữ liệu truy vấn được mã hóa Base64.

#### Thực thi Contract

```
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

### API EduCert

#### Cấp Văn bằng

```
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

#### Xác minh Văn bằng

```
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

#### Kiểm tra Thu hồi

```
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

### API EduID

#### Đăng ký DID

```
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

#### Truy vấn DID

```
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

#### Truy vấn Hash DID

```
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

### API EduPay

#### Tạo Escrow Thanh toán

```
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

#### Giải ngân Escrow

```
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

#### Kiểm tra Escrow

```
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

### API ResearchLedger

#### Đăng ký Hash Nghiên cứu

```
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

#### Truy vấn Nghiên cứu

```
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

#### Kiểm tra Đạo văn

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

### API EduAdmission

#### Phát hành Seat-NFT

```
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

#### Đăng ký Tuyển sinh

```
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

#### Truy vấn Kết quả Tuyển sinh

```
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

### Lỗi và Mã Trạng thái

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

### Giới hạn Rate

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

### Ví dụ Sử dụng (Curl)

Lấy thông tin tài khoản:

```bash
curl -X GET "http://localhost:1317/cosmos/auth/v1beta1/accounts/cosmos1abcdefghijklmnopqrstuvwxyz"
```

Truy vấn trạng thái contract EduCert:

```bash
curl -X GET "http://localhost:1317/cosmwasm/wasm/v1/contract/cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s4hmalr/smart/eyJnZXRfY3JlZGVudGlhbCI6eyJoYXNoIjoiYWJjMTIzIn19"
```

### Hướng dẫn Sử dụng SDK TypeScript

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
