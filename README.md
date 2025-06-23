# DNU-FTA-VietEduChain

## TỔNG QUAN

VietEduChain là một dự án blockchain được xây dựng trên nền tảng Cosmos SDK, được thiết kế để hỗ trợ quy trình quản lý chất lượng đào tạo đại học tại Việt Nam thông qua các ứng dụng phi tập trung và hợp đồng thông minh. Dự án nhằm nâng cao tính minh bạch, bảo mật và hiệu quả trong các hoạt động quản lý giáo dục, bao gồm cấp bằng và chứng chỉ, quản lý danh tính (các trường đại học, cá nhân, bằng và chứng chỉ, v.v...), xử lý thanh toán, tính toàn vẹn trong nghiên cứu và minh bạch trong tuyển sinh, đào tạo.

## MỤC TIÊU VÀ PHẠM VI DỰ ÁN

### Mục tiêu tổng quát

1. Xây dựng VietEduChain Layer-1 chuyên biệt cho giáo dục đại học của Việt Nam, đáp ứng đồng thời ba trụ cột: (1) Hiệu năng cấp hạ tầng; (2) thông lượng ≥ 30.000 giao dịch/giây; (3) thời gian hoàn tất ("finality") ≈ 1,2 giây; phí giao dịch < 0,1% giá trị.
2. Chuẩn dữ liệu quốc tế: hỗ trợ đầy đủ Verifiable Credential (VC) và Decentralized Identifier (DID) theo khuyến nghị W3C; sẵn sàng liên thông qua Inter-Blockchain Communication (IBC).
3. Phục vụ trọn chu trình đào tạo: từ tuyển sinh, quản lý học phí, quá trình đào tạo, cấp phát văn bằng, đến lưu vết nghiên cứu khoa học – bảo đảm minh bạch, an toàn dữ liệu và khả năng mở rộng, phát triển lâu dài.

## TÍNH NĂNG

### Backend (BE)

- **Lớp Core**: Xây dựng trên đồng thuận HotStuff, DAG mempool và CosmWasm để đảm bảo khả năng mở rộng và hiệu suất.
- **Module Chức Năng**: Bao gồm EduCert, EduID, EduPay, ResearchLedger và EduAdmission để phục vụ các quy trình khác nhau trong chu trình đào tạo của các trường.
- **API & SDK**: REST/gRPC và GraphQL API, cùng với JS/Flutter SDK để dễ dàng tích hợp.
- **Khả Năng Tương Tác**: IBC relay và khả năng cross-chain để kết nối với các blockchain khác.
- **Công Cụ Giám Sát**: Prometheus và Grafana để minh bạch dữ liệu thời gian thực và theo dõi KPI.
- **Tuân Thủ Pháp Lý**: Tuân thủ các tiêu chuẩn PDPA Việt Nam 2023 và GDPR về bảo vệ dữ liệu.

### Frontend (FE)

- **Giao diện người dùng hiện đại**: Xây dựng trên React và Next.js với thiết kế đáp ứng cho các thiết bị khác nhau.
- **Các module tương tác**: Giao diện người dùng cho tất cả các module blockchain (EduID, EduCert, EduPay, ResearchLedger, EduAdmission).
- **Tích hợp API**: Tương tác với backend thông qua các API RESTful được chuẩn hóa theo Cosmos SDK.
- **Xác thực và phân quyền**: Hỗ trợ đăng nhập, quản lý phiên và phân quyền người dùng.
- **Quản lý trạng thái**: Sử dụng React Context và các provider để quản lý trạng thái ứng dụng.
- **Đa ngôn ngữ**: Hỗ trợ tiếng Việt và tiếng Anh cho tất cả các giao diện.

## SMART CONTRACTS

Dự án bao gồm các hợp đồng thông minh sau:

1. **EduCert**: Quản lý văn bằng tốt nghiệp và chứng chỉ: xử lý việc cấp, xác minh và thu hồi bằng tốt nghiệp cũng như đối với chứng chỉ các khóa đào tạo ngắn hạn.

2. **EduPay**: Xử lý thanh toán học phí an toàn giữa các cơ sở đào tạo và sinh viên.

3. **EduID**: Xác minh danh tính dựa trên hệ thống nhận dạng phi tập trung (DID) cho ngữ cảnh đào tạo.

4. **ResearchLedger**: Ghi chép và xác minh đóng góp nghiên cứu khoa học và xuất bản, chống đạo văn.

5. **EduAdmission**: Quản lý quá trình tuyển sinh của các cơ sở đào tạo và tiêu chuẩn của thí sinh.

## BẮT ĐẦU

### Yêu cầu hệ thống

- Rust (phiên bản 1.70.0 trở lên)
- Go (phiên bản 1.20 trở lên)
- Docker và Docker Compose
- wasm32-unknown-unknown target cho Rust (`rustup target add wasm32-unknown-unknown`)
- Node.js (phiên bản 18 trở lên) cho Frontend

### Cài đặt môi trường phát triển

1. Clone repository:

```bash
git clone https://github.com/yourusername/viet-educhain.git
cd viet-educhain
```

2. Khởi động node blockchain:

```bash
cd be/educhain/deployments/devnet
./run_wasmd_node.sh
```

3. Build các smart contract:

```bash
cd be/educhain/deployments/scripts
./build_educhain_contracts.sh
```

4. Deploy các smart contract lên blockchain:

```bash
cd be/educhain/deployments/scripts
./deploy_educhain_contracts.sh
```

5. Chạy frontend:

```bash
cd fe
npm install
npm run dev
```

### Triển khai lên server

Khi triển khai lên môi trường server, hãy tuân thủ chính xác các bước sau theo thứ tự:

1. Clone code repository:

```bash
git clone https://github.com/yourusername/viet-educhain.git
cd viet-educhain
```

2. Khởi tạo và chạy blockchain node:

```bash
cd be/educhain/deployments/devnet
./run_wasmd_node.sh
```

3. Build tất cả các smart contract:

```bash
cd be/educhain/deployments/scripts
./build_educhain_contracts.sh
```

4. Deploy các smart contract lên blockchain:

```bash
cd be/educhain/deployments/scripts
./deploy_educhain_contracts.sh
```

5. Cập nhật địa chỉ contract trong cấu hình ứng dụng:

```bash
# Địa chỉ contract sẽ được lưu trong các file sau khi deploy
cat be/educhain/deployments/devnet/data/educert_address.txt
cat be/educhain/deployments/devnet/data/edupay_address.txt
cat be/educhain/deployments/devnet/data/eduid_address.txt
cat be/educhain/deployments/devnet/data/researchledger_address.txt
cat be/educhain/deployments/devnet/data/eduadmission_address.txt
```

6. Cấu hình và khởi chạy frontend:

```bash
cd fe
npm install
npm run build
npm run start
```

**Lưu ý quan trọng**: Môi trường server sẽ không tự động đồng bộ hóa với môi trường phát triển riêng của bạn (người phát triển hệ thống). Dữ liệu blockchain, trạng thái tài khoản và tương tác hợp đồng từ môi trường phát triển riêng của bạn sẽ không có trên server. Mỗi lần triển khai tạo ra một phiên bản blockchain mới với trạng thái ban đầu.

### Tương tác với Contracts

Sau khi triển khai, bạn có thể tương tác với các hợp đồng thông minh bằng các script được cung cấp:

```bash
cd be/educhain/deployments/scripts
./interact_with_contracts.sh <contract_name> <function_name> <parameters>
```

## THÔNG TIN KÍCH THƯỚC CONTRACT

Kích thước contract đã biên dịch hiện tại:

- **educert**: 226,859 bytes
- **edupay**: 149,759 bytes
- **eduid**: 155,441 bytes
- **researchledger**: 158,669 bytes
- **eduadmission**: 165,948 bytes

## XỬ LÝ SỰ CỐ

Nếu bạn gặp sự cố khi build các smart contract, bạn có thể thử phương pháp build thủ công:

```bash
cd be/educhain/deployments/scripts
./manual_build_contracts.sh
```

Nếu bạn gặp vấn đề với frontend, hãy thử:

```bash
cd fe
npm clean-install
npm run dev
```

## ĐÓNG GÓP

Chúng tôi hoan nghênh những ý kiến đóng góp bổ sung và hoàn thiện! Vui lòng gửi pull request hoặc mở issue cho bất kỳ sự hoàn thiện, nâng cấp hoặc sửa lỗi.

## GIẤY PHÉP

Dự án này được cấp phép theo Giấy phép MIT. Xem file LICENSE để biết chi tiết.

## CHI TIẾT CÁC MODULE

### EduID

Module quản lý danh tính dựa trên DID (Decentralized Identifiers), cho phép:
- Tạo danh tính số mới
- Truy vấn thông tin danh tính
- Cập nhật thông tin danh tính
- Xác thực danh tính

### EduCert

Module quản lý văn bằng điện tử, hỗ trợ:
- Cấp văn bằng mới
- Xác minh tính chính xác của văn bằng
- Chia sẻ văn bằng với bên thứ ba
- Kiểm tra lịch sử thay đổi

### EduPay

Module thanh toán học phí và học bổng:
- Tạo escrow thanh toán học phí
- Xác nhận đăng ký học
- Giải ngân học phí cho trường
- Quản lý học bổng

### ResearchLedger

Module quản lý nghiên cứu khoa học:
- Đăng ký nghiên cứu mới
- Lưu trữ hash của tài liệu nghiên cứu
- Kiểm tra trùng lặp và đạo văn
- Quản lý quyền sở hữu trí tuệ

### EduAdmission

Module quản lý tuyển sinh theo quy định của Bộ Giáo dục và Đào tạo:
- Đăng ký tuyển sinh
- Xác nhận kết quả
- Công bố điểm và kết quả tuyển sinh vào ngành học theo các nguyện vọng đăng ký.
- Xác thực quy trình và kết quả tuyển sinh của cơ sở đào tạo
