# HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH NODE COSMOS PERMISSIONED NETWORK

## TỔNG QUAN

Tài liệu này hướng dẫn cài đặt và vận hành một node CosmWasm (wasmd) cho mạng blockchain permissioned của EduChain. Node này được xây dựng dựa trên CosmWasm/wasmd v0.50.0 với các bản vá lỗi cần thiết để đảm bảo hoạt động ổn định.

## YÊU CẦU HỆ THỐNG

- Docker và Docker Compose
- Ít nhất 4GB RAM
- Ít nhất 50GB dung lượng ổ cứng
- Kết nối internet ổn định

## CÁC THÀNH PHẦN

1. **Dockerfile.fixed**: File Dockerfile đã được sửa để build image wasmd với bản vá lỗi
2. **run_wasmd_node.sh**: Script khởi tạo và chạy node wasmd
3. **docker-compose.yml**: File cấu hình Docker Compose để chạy node từ dữ liệu đã khởi tạo
4. **docker-compose-full.yml**: File cấu hình Docker Compose đầy đủ (bao gồm cả khởi tạo)
5. **wasmd.patch**: Bản vá lỗi cho mã nguồn wasmd

## HƯỚNG DẪN CÀI ĐẶT

### Phương pháp 1: Sử dụng script (Khuyến nghị)

1. **Build image Docker**

   ```bash
   docker build -t cosmwasm/wasmd:v0.50.0-patched -f Dockerfile.fixed .
   ```

2. **Chạy script khởi tạo và vận hành node**

   ```bash
   chmod +x run_wasmd_node.sh
   ./run_wasmd_node.sh
   ```

   Script này sẽ thực hiện các bước sau:
   - Khởi tạo node với chain-id "testing"
   - Tạo khóa validator
   - Thêm tài khoản genesis với tokens
   - Tạo giao dịch validator (gentx)
   - Cấu hình node để truy cập từ bên ngoài
   - Khởi động node

### Phương pháp 2: Sử dụng Docker Compose

1. **Khởi tạo node trước (nếu chưa có dữ liệu)**

   ```bash
   chmod +x run_wasmd_node.sh
   ./run_wasmd_node.sh
   ```

2. **Sử dụng Docker Compose để chạy node**

   ```bash
   docker-compose up -d
   ```

   Hoặc sử dụng phiên bản đầy đủ (bao gồm cả khởi tạo):

   ```bash
   docker-compose -f docker-compose-full.yml up -d
   ```

## KIỂM TRA TRẠNG THÁI NODE

1. **Kiểm tra trạng thái node**

   ```bash
   curl http://localhost:26657/status
   ```

2. **Kiểm tra số dư của validator**

   ```bash
   curl http://localhost:1317/cosmos/bank/v1beta1/balances/$(docker run --rm -v $(pwd)/data:/root/.wasmd cosmwasm/wasmd:v0.50.0-patched keys show validator -a --keyring-backend test)
   ```

## QUẢN LÝ NODE

1. **Dừng node**

   ```bash
   docker stop wasm-node
   ```

   Hoặc nếu sử dụng Docker Compose:

   ```bash
   docker-compose down
   ```

2. **Khởi động lại node**

   ```bash
   docker start wasm-node
   ```

   Hoặc sử dụng Docker Compose:

   ```bash
   docker-compose up -d
   ```

3. **Xem logs của node**

   ```bash
   docker logs -f wasm-node
   ```

## THÔNG TIN ENDPOINTS

Node sau khi được khởi động sẽ cung cấp các endpoints sau:

- **RPC API**: http://localhost:26657
- **REST API**: http://localhost:1317
- **gRPC**: http://localhost:9090

## XỬ LÝ SỰ CỐ

1. **Lỗi khởi tạo validator**

   Nếu gặp lỗi "validator set is empty after InitGenesis", hãy đảm bảo số lượng token staking đủ lớn. Script `run_wasmd_node.sh` đã được cấu hình với số lượng token phù hợp (300,000,000,000 stake).

2. **Lỗi truy cập API**

   Kiểm tra cấu hình trong các file:
   - `data/config/config.toml`
   - `data/config/app.toml`

   Đảm bảo rằng các địa chỉ lắng nghe được cấu hình là `0.0.0.0` thay vì `localhost` hoặc `127.0.0.1`.

3. **Lỗi kết nối cơ sở dữ liệu**

   Nếu node không thể truy cập cơ sở dữ liệu, hãy kiểm tra quyền truy cập vào thư mục `data/`:

   ```bash
   sudo chown -R $(id -u):$(id -g) data/
   ```

## CHI TIẾT BẢN VÁ LỖI

Trong wasmd v0.50.0, có một vấn đề khi sử dụng không đúng cách `runtime.NewKVStoreService()`. Hàm này trả về kiểu `KVStoreService`, nhưng mã nguồn mong đợi kiểu `StoreKey` ở nhiều nơi. Bản vá lỗi thay thế tất cả các trường hợp sử dụng `runtime.NewKVStoreService(keys[someStoreKey])` bằng `keys[someStoreKey]` trong các file:

- app/app.go (file ứng dụng chính)
- x/wasm/keeper/test_common.go (tiện ích kiểm thử)

## THÔNG TIN LIÊN HỆ HỖ TRỢ

Nếu bạn gặp bất kỳ vấn đề nào khi cài đặt hoặc vận hành node, vui lòng liên hệ với đội ngũ hỗ trợ kỹ thuật của EduChain.
