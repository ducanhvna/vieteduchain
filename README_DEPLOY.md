# Hướng dẫn Build, Run và Deploy Cosmos Permissioned Network

## 1. Yêu cầu hệ thống
- Docker & Docker Compose
- Node.js (>=18) và npm (nếu muốn phát triển UI ngoài container)
- Go (>=1.20, nếu muốn phát triển core ngoài container)

## 2. Build & Run toàn bộ hệ thống bằng Docker Compose

```bash
cd deploy
# Build tất cả các service
# (Lần đầu hoặc khi có thay đổi code)
docker compose build

# Khởi động toàn bộ hệ thống (chạy nền)
docker compose up -d

# Kiểm tra trạng thái các container
docker compose ps

# Xem log một service (ví dụ core)
docker compose logs -f core
```

## 3. Truy cập các thành phần
- UI: http://localhost:3179, http://localhost:3180, http://localhost:3189
- API: http://localhost:8279/docs, http://localhost:8280/docs, http://localhost:8289/docs
- Core healthcheck: http://localhost:26657/status, http://localhost:26658/status, http://localhost:26667/status

## 4. Phát triển từng thành phần (dev mode)

### UI (Next.js)
```bash
cd ui # hoặc ui1, ui2
npm install
npm run dev
# Truy cập http://localhost:3000
```

### API (FastAPI)
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Truy cập http://localhost:8000/docs
```

### Core (Go)
```bash
cd core
# Chạy thử ngoài container
# (Cần Go >=1.20)
go run ./cmd/main.go start
# Kiểm tra health: curl http://localhost:26657/status
```

## 5. Dừng và xóa toàn bộ container
```bash
cd deploy
docker compose down
```

## 6. Ghi chú
- Khi thay đổi code Go hoặc Python, nên build lại image tương ứng: `docker compose build core` hoặc `docker compose build api`.
- Nếu chỉ thay đổi code UI, có thể dùng hot reload ngoài container hoặc build lại image.
- Các service core, api, ui đều có healthcheck tự động.
