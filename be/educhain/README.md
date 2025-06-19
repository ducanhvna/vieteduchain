# DỰ ÁN EDUCHAIN

## TỔNG QUAN

EduChain là một dự án blockchain được xây dựng trên nền tảng Cosmos SDK, được thiết kế để hỗ trợ các quy trình giáo dục thông qua các ứng dụng phi tập trung và hợp đồng thông minh. Dự án nhằm nâng cao tính minh bạch, bảo mật và hiệu quả trong các hoạt động giáo dục, bao gồm cấp chứng chỉ, quản lý danh tính, xử lý thanh toán, tính toàn vẹn trong nghiên cứu và minh bạch trong tuyển sinh.

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

- **Mở Ưu Tiên**: Ưu tiên phát triển mã nguồn mở với giấy phép tương thích Apache-2.0 hoặc GPL.
- **Khả Năng Tương Tác Trong Thiết Kế**: Đảm bảo tất cả các module đều tương thích IBC và sử dụng tiêu chuẩn dữ liệu JSON-LD/VC.
- **Bảo Mật & Quyền Riêng Tư Mặc Định**: Tích hợp Zero-Knowledge Proofs để tiết lộ có chọn lọc và mã hóa đầu cuối.
- **Hướng Người Dùng**: Trao quyền cho người dùng với danh tính tự chủ (SSI) và cơ chế khôi phục xã hội cho ví.

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

## ĐÓNG GÓP

Chúng tôi rất hoan nghênh đóng góp của bạn! Vui lòng làm theo hướng dẫn trong tài liệu của dự án để đóng góp vào dự án EduChain.

## LIÊN HỆ HỖ TRỢ

Nếu bạn gặp bất kỳ vấn đề nào khi cài đặt hoặc sử dụng EduChain, vui lòng liên hệ với đội ngũ hỗ trợ kỹ thuật của chúng tôi.