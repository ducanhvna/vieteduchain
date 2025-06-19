#!/bin/bash

# Script để tương tác với các smart contract đã triển khai của EduChain
# Script này cung cấp các lệnh để tương tác với các chức năng của từng contract

# Cài đặt các biến môi trường
CHAIN_ID="testing"
NODE="http://localhost:26657"
VALIDATOR_ADDR="wasm13dldhu8zx7l9cua2z8mugxwudpdh9eac6e0g8s"
GAS="auto"
GAS_PRICES="0.025stake"
DATA_DIR="/Users/dungbui299/Documents/github/cosmos-permissioned-network/be/educhain/deployments/devnet/data"

# Kiểm tra Docker container đang chạy
if ! docker ps | grep -q wasm-node; then
  echo "Lỗi: Container wasm-node không chạy. Hãy khởi động lại node trước."
  exit 1
fi

# Lấy địa chỉ các contract
read_contract_address() {
  local contract_name=$1
  local addr_file="${DATA_DIR}/${contract_name}_address.txt"
  
  if [[ -f "${addr_file}" ]]; then
    cat "${addr_file}"
  else
    echo ""
  fi
}

EDUID_ADDR=$(read_contract_address "eduid")
EDUCERT_ADDR=$(read_contract_address "educert")
EDUPAY_ADDR=$(read_contract_address "edupay")
RESEARCHLEDGER_ADDR=$(read_contract_address "researchledger")
EDUADMISSION_ADDR=$(read_contract_address "eduadmission")

# Hiển thị menu chức năng
show_menu() {
  clear
  echo "====================================================="
  echo "TƯƠNG TÁC VỚI CÁC SMART CONTRACT EDUCHAIN"
  echo "====================================================="
  echo "1. EduID - Quản lý danh tính"
  echo "2. EduCert - Cấp và xác minh văn bằng"
  echo "3. EduPay - Thanh toán học phí và học bổng"
  echo "4. ResearchLedger - Quản lý nghiên cứu"
  echo "5. EduAdmission - Tuyển sinh minh bạch"
  echo "0. Thoát"
  echo "====================================================="
  echo -n "Vui lòng chọn một module (0-5): "
  read choice
  
  case $choice in
    1) eduid_menu ;;
    2) educert_menu ;;
    3) edupay_menu ;;
    4) researchledger_menu ;;
    5) eduadmission_menu ;;
    0) exit 0 ;;
    *) echo "Lựa chọn không hợp lệ"; sleep 2; show_menu ;;
  esac
}

# Menu chức năng EduID
eduid_menu() {
  clear
  echo "====================================================="
  echo "EDUID - QUẢN LÝ DANH TÍNH"
  echo "====================================================="
  echo "Địa chỉ contract: ${EDUID_ADDR}"
  echo "====================================================="
  echo "1. Tạo DID mới"
  echo "2. Truy vấn DID theo địa chỉ"
  echo "3. Cập nhật DID Document"
  echo "4. Xem danh sách DID"
  echo "0. Quay lại menu chính"
  echo "====================================================="
  echo -n "Vui lòng chọn một chức năng (0-4): "
  read choice
  
  case $choice in
    1) create_did ;;
    2) query_did ;;
    3) update_did ;;
    4) list_dids ;;
    0) show_menu ;;
    *) echo "Lựa chọn không hợp lệ"; sleep 2; eduid_menu ;;
  esac
}

# Menu chức năng EduCert
educert_menu() {
  clear
  echo "====================================================="
  echo "EDUCERT - CẤP VÀ XÁC MINH VĂN BẰNG"
  echo "====================================================="
  echo "Địa chỉ contract: ${EDUCERT_ADDR}"
  echo "====================================================="
  echo "1. Cấp văn bằng mới"
  echo "2. Xác minh văn bằng"
  echo "3. Thu hồi văn bằng"
  echo "4. Xem danh sách văn bằng đã cấp"
  echo "0. Quay lại menu chính"
  echo "====================================================="
  echo -n "Vui lòng chọn một chức năng (0-4): "
  read choice
  
  case $choice in
    1) issue_certificate ;;
    2) verify_certificate ;;
    3) revoke_certificate ;;
    4) list_certificates ;;
    0) show_menu ;;
    *) echo "Lựa chọn không hợp lệ"; sleep 2; educert_menu ;;
  esac
}

# Menu chức năng EduPay
edupay_menu() {
  clear
  echo "====================================================="
  echo "EDUPAY - THANH TOÁN HỌC PHÍ VÀ HỌC BỔNG"
  echo "====================================================="
  echo "Địa chỉ contract: ${EDUPAY_ADDR}"
  echo "====================================================="
  echo "1. Tạo giao dịch thanh toán học phí"
  echo "2. Cấp học bổng"
  echo "3. Xem lịch sử giao dịch"
  echo "4. Kiểm tra số dư tài khoản"
  echo "0. Quay lại menu chính"
  echo "====================================================="
  echo -n "Vui lòng chọn một chức năng (0-4): "
  read choice
  
  case $choice in
    1) create_payment ;;
    2) create_scholarship ;;
    3) view_transaction_history ;;
    4) check_balance ;;
    0) show_menu ;;
    *) echo "Lựa chọn không hợp lệ"; sleep 2; edupay_menu ;;
  esac
}

# Menu chức năng ResearchLedger
researchledger_menu() {
  clear
  echo "====================================================="
  echo "RESEARCHLEDGER - QUẢN LÝ NGHIÊN CỨU"
  echo "====================================================="
  echo "Địa chỉ contract: ${RESEARCHLEDGER_ADDR}"
  echo "====================================================="
  echo "1. Đăng ký nghiên cứu mới"
  echo "2. Kiểm tra trùng lặp nghiên cứu"
  echo "3. Cấp DOI-NFT"
  echo "4. Xem danh sách nghiên cứu"
  echo "0. Quay lại menu chính"
  echo "====================================================="
  echo -n "Vui lòng chọn một chức năng (0-4): "
  read choice
  
  case $choice in
    1) register_research ;;
    2) check_plagiarism ;;
    3) mint_doi_nft ;;
    4) list_research ;;
    0) show_menu ;;
    *) echo "Lựa chọn không hợp lệ"; sleep 2; researchledger_menu ;;
  esac
}

# Menu chức năng EduAdmission
eduadmission_menu() {
  clear
  echo "====================================================="
  echo "EDUADMISSION - TUYỂN SINH MINH BẠCH"
  echo "====================================================="
  echo "Địa chỉ contract: ${EDUADMISSION_ADDR}"
  echo "====================================================="
  echo "1. Tạo chỉ tiêu tuyển sinh (Seat-NFT)"
  echo "2. Đăng ký nguyện vọng"
  echo "3. Cập nhật điểm thi"
  echo "4. Chạy thuật toán xét tuyển"
  echo "5. Xem kết quả tuyển sinh"
  echo "0. Quay lại menu chính"
  echo "====================================================="
  echo -n "Vui lòng chọn một chức năng (0-5): "
  read choice
  
  case $choice in
    1) create_admission_seats ;;
    2) register_admission_preference ;;
    3) update_exam_scores ;;
    4) run_admission_algorithm ;;
    5) view_admission_results ;;
    0) show_menu ;;
    *) echo "Lựa chọn không hợp lệ"; sleep 2; eduadmission_menu ;;
  esac
}

# Các hàm xử lý chức năng EduID
create_did() {
  clear
  echo "====================================================="
  echo "TẠO DID MỚI"
  echo "====================================================="
  echo -n "Nhập tên người dùng: "
  read name
  echo -n "Nhập email: "
  read email
  echo -n "Nhập public key (để trống nếu không có): "
  read public_key
  
  if [ -z "$public_key" ]; then
    public_key="default_key_$(date +%s)"
  fi
  
  execute_msg="{\"register_did\":{\"did_doc\":{\"context\":\"https://www.w3.org/ns/did/v1\",\"id\":\"did:educhain:$name\",\"public_key\":\"$public_key\",\"service_endpoint\":\"$email\"}}}"
  
  echo "Đang tạo DID..."
  docker exec wasm-node wasmd tx wasm execute ${EDUID_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "DID đã được tạo thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  eduid_menu
}

query_did() {
  clear
  echo "====================================================="
  echo "TRUY VẤN DID THEO ĐỊA CHỈ"
  echo "====================================================="
  echo -n "Nhập DID (ví dụ: did:educhain:name): "
  read did
  
  query_msg="{\"get_did\":{\"did\":\"$did\"}}"
  
  echo "Đang truy vấn DID..."
  docker exec wasm-node wasmd query wasm contract-state smart ${EDUID_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  eduid_menu
}

update_did() {
  clear
  echo "====================================================="
  echo "CẬP NHẬT DID DOCUMENT"
  echo "====================================================="
  echo -n "Nhập DID hiện tại (ví dụ: did:educhain:name): "
  read did
  echo -n "Nhập public key mới: "
  read public_key
  echo -n "Nhập service endpoint mới (email): "
  read email
  
  execute_msg="{\"update_did\":{\"did_doc\":{\"context\":\"https://www.w3.org/ns/did/v1\",\"id\":\"$did\",\"public_key\":\"$public_key\",\"service_endpoint\":\"$email\"}}}"
  
  echo "Đang cập nhật DID..."
  docker exec wasm-node wasmd tx wasm execute ${EDUID_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "DID đã được cập nhật thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  eduid_menu
}

list_dids() {
  clear
  echo "====================================================="
  echo "XEM DANH SÁCH DID"
  echo "====================================================="
  
  # Giả sử contract có hàm list_dids - cần bổ sung nếu chưa có
  query_msg="{\"list_dids\":{}}"
  
  echo "Đang lấy danh sách DID..."
  docker exec wasm-node wasmd query wasm contract-state smart ${EDUID_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  eduid_menu
}

# Các hàm xử lý chức năng EduCert
issue_certificate() {
  clear
  echo "====================================================="
  echo "CẤP VĂN BẰNG MỚI"
  echo "====================================================="
  echo -n "Nhập hash của văn bằng: "
  read hash
  echo -n "Nhập metadata (JSON): "
  read metadata
  echo -n "Nhập tên đơn vị cấp: "
  read issuer
  
  # Tạo chữ ký giả định
  signature="sig_$(date +%s)"
  
  execute_msg="{\"issue_vc\":{\"hash\":\"$hash\",\"metadata\":\"$metadata\",\"issuer\":\"$issuer\",\"signature\":\"$signature\"}}"
  
  echo "Đang cấp văn bằng..."
  docker exec wasm-node wasmd tx wasm execute ${EDUCERT_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Văn bằng đã được cấp thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  educert_menu
}

verify_certificate() {
  clear
  echo "====================================================="
  echo "XÁC MINH VĂN BẰNG"
  echo "====================================================="
  echo -n "Nhập hash của văn bằng cần xác minh: "
  read hash
  
  query_msg="{\"verify_credential\":{\"hash\":\"$hash\"}}"
  
  echo "Đang xác minh văn bằng..."
  docker exec wasm-node wasmd query wasm contract-state smart ${EDUCERT_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  educert_menu
}

revoke_certificate() {
  clear
  echo "====================================================="
  echo "THU HỒI VĂN BẰNG"
  echo "====================================================="
  echo -n "Nhập hash của văn bằng cần thu hồi: "
  read hash
  
  execute_msg="{\"revoke_vc\":{\"hash\":\"$hash\"}}"
  
  echo "Đang thu hồi văn bằng..."
  docker exec wasm-node wasmd tx wasm execute ${EDUCERT_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Văn bằng đã bị thu hồi!"
  echo "Nhấn Enter để tiếp tục..."
  read
  educert_menu
}

list_certificates() {
  clear
  echo "====================================================="
  echo "XEM DANH SÁCH VĂN BẰNG ĐÃ CẤP"
  echo "====================================================="
  
  query_msg="{\"list_credentials\":{}}"
  
  echo "Đang lấy danh sách văn bằng..."
  docker exec wasm-node wasmd query wasm contract-state smart ${EDUCERT_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  educert_menu
}

# Các hàm xử lý chức năng EduPay
create_payment() {
  clear
  echo "====================================================="
  echo "TẠO GIAO DỊCH THANH TOÁN HỌC PHÍ"
  echo "====================================================="
  echo -n "Nhập địa chỉ người nộp: "
  read payer
  echo -n "Nhập địa chỉ trường: "
  read school
  echo -n "Nhập số tiền (stake): "
  read amount
  echo -n "Nhập mã khóa học/môn học: "
  read course_id
  
  execute_msg="{\"create_payment\":{\"payer\":\"$payer\",\"school\":\"$school\",\"amount\":\"$amount\",\"course_id\":\"$course_id\"}}"
  
  echo "Đang tạo giao dịch thanh toán..."
  docker exec wasm-node wasmd tx wasm execute ${EDUPAY_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Giao dịch thanh toán đã được tạo thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  edupay_menu
}

create_scholarship() {
  clear
  echo "====================================================="
  echo "CẤP HỌC BỔNG"
  echo "====================================================="
  echo -n "Nhập địa chỉ người nhận: "
  read recipient
  echo -n "Nhập địa chỉ đơn vị cấp: "
  read provider
  echo -n "Nhập số tiền (stake): "
  read amount
  echo -n "Nhập mô tả học bổng: "
  read description
  
  execute_msg="{\"create_scholarship\":{\"recipient\":\"$recipient\",\"provider\":\"$provider\",\"amount\":\"$amount\",\"description\":\"$description\"}}"
  
  echo "Đang cấp học bổng..."
  docker exec wasm-node wasmd tx wasm execute ${EDUPAY_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Học bổng đã được cấp thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  edupay_menu
}

view_transaction_history() {
  clear
  echo "====================================================="
  echo "XEM LỊCH SỬ GIAO DỊCH"
  echo "====================================================="
  echo -n "Nhập địa chỉ (để trống để xem tất cả): "
  read address
  
  if [ -z "$address" ]; then
    query_msg="{\"transaction_history\":{}}"
  else
    query_msg="{\"transaction_history\":{\"address\":\"$address\"}}"
  fi
  
  echo "Đang lấy lịch sử giao dịch..."
  docker exec wasm-node wasmd query wasm contract-state smart ${EDUPAY_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  edupay_menu
}

check_balance() {
  clear
  echo "====================================================="
  echo "KIỂM TRA SỐ DƯ TÀI KHOẢN"
  echo "====================================================="
  echo -n "Nhập địa chỉ: "
  read address
  
  query_msg="{\"balance\":{\"address\":\"$address\"}}"
  
  echo "Đang kiểm tra số dư..."
  docker exec wasm-node wasmd query wasm contract-state smart ${EDUPAY_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  edupay_menu
}

# Các hàm xử lý chức năng ResearchLedger
register_research() {
  clear
  echo "====================================================="
  echo "ĐĂNG KÝ NGHIÊN CỨU MỚI"
  echo "====================================================="
  echo -n "Nhập tiêu đề nghiên cứu: "
  read title
  echo -n "Nhập tên tác giả: "
  read author
  echo -n "Nhập tóm tắt nghiên cứu: "
  read abstract
  echo -n "Nhập hash nội dung nghiên cứu: "
  read content_hash
  
  execute_msg="{\"register_research\":{\"title\":\"$title\",\"author\":\"$author\",\"abstract\":\"$abstract\",\"content_hash\":\"$content_hash\"}}"
  
  echo "Đang đăng ký nghiên cứu..."
  docker exec wasm-node wasmd tx wasm execute ${RESEARCHLEDGER_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Nghiên cứu đã được đăng ký thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  researchledger_menu
}

check_plagiarism() {
  clear
  echo "====================================================="
  echo "KIỂM TRA TRÙNG LẶP NGHIÊN CỨU"
  echo "====================================================="
  echo -n "Nhập hash nội dung cần kiểm tra: "
  read content_hash
  
  query_msg="{\"check_plagiarism\":{\"content_hash\":\"$content_hash\"}}"
  
  echo "Đang kiểm tra trùng lặp..."
  docker exec wasm-node wasmd query wasm contract-state smart ${RESEARCHLEDGER_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  researchledger_menu
}

mint_doi_nft() {
  clear
  echo "====================================================="
  echo "CẤP DOI-NFT"
  echo "====================================================="
  echo -n "Nhập ID nghiên cứu: "
  read research_id
  echo -n "Nhập DOI (Digital Object Identifier): "
  read doi
  echo -n "Nhập địa chỉ người nhận: "
  read recipient
  
  execute_msg="{\"mint_doi_nft\":{\"research_id\":\"$research_id\",\"doi\":\"$doi\",\"recipient\":\"$recipient\"}}"
  
  echo "Đang cấp DOI-NFT..."
  docker exec wasm-node wasmd tx wasm execute ${RESEARCHLEDGER_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "DOI-NFT đã được cấp thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  researchledger_menu
}

list_research() {
  clear
  echo "====================================================="
  echo "XEM DANH SÁCH NGHIÊN CỨU"
  echo "====================================================="
  
  query_msg="{\"list_research\":{}}"
  
  echo "Đang lấy danh sách nghiên cứu..."
  docker exec wasm-node wasmd query wasm contract-state smart ${RESEARCHLEDGER_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  researchledger_menu
}

# Các hàm xử lý chức năng EduAdmission
create_admission_seats() {
  clear
  echo "====================================================="
  echo "TẠO CHỈ TIÊU TUYỂN SINH (SEAT-NFT)"
  echo "====================================================="
  echo -n "Nhập mã trường: "
  read school_code
  echo -n "Nhập tên ngành: "
  read major
  echo -n "Nhập số lượng chỉ tiêu: "
  read quota
  echo -n "Nhập điểm chuẩn tối thiểu: "
  read min_score
  
  execute_msg="{\"create_admission_seats\":{\"school_code\":\"$school_code\",\"major\":\"$major\",\"quota\":$quota,\"min_score\":$min_score}}"
  
  echo "Đang tạo chỉ tiêu tuyển sinh..."
  docker exec wasm-node wasmd tx wasm execute ${EDUADMISSION_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Chỉ tiêu tuyển sinh đã được tạo thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  eduadmission_menu
}

register_admission_preference() {
  clear
  echo "====================================================="
  echo "ĐĂNG KÝ NGUYỆN VỌNG"
  echo "====================================================="
  echo -n "Nhập địa chỉ thí sinh: "
  read student
  echo -n "Nhập mã trường (nguyện vọng 1): "
  read school1
  echo -n "Nhập mã ngành (nguyện vọng 1): "
  read major1
  echo -n "Nhập mã trường (nguyện vọng 2): "
  read school2
  echo -n "Nhập mã ngành (nguyện vọng 2): "
  read major2
  
  preferences="[{\"school\":\"$school1\",\"major\":\"$major1\"},{\"school\":\"$school2\",\"major\":\"$major2\"}]"
  
  execute_msg="{\"register_preferences\":{\"student\":\"$student\",\"preferences\":$preferences}}"
  
  echo "Đang đăng ký nguyện vọng..."
  docker exec wasm-node wasmd tx wasm execute ${EDUADMISSION_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Nguyện vọng đã được đăng ký thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  eduadmission_menu
}

update_exam_scores() {
  clear
  echo "====================================================="
  echo "CẬP NHẬT ĐIỂM THI"
  echo "====================================================="
  echo -n "Nhập địa chỉ thí sinh: "
  read student
  echo -n "Nhập điểm toán: "
  read math
  echo -n "Nhập điểm văn: "
  read literature
  echo -n "Nhập điểm ngoại ngữ: "
  read foreign_lang
  
  scores="{\"math\":$math,\"literature\":$literature,\"foreign_language\":$foreign_lang}"
  
  execute_msg="{\"update_exam_scores\":{\"student\":\"$student\",\"scores\":$scores}}"
  
  echo "Đang cập nhật điểm thi..."
  docker exec wasm-node wasmd tx wasm execute ${EDUADMISSION_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Điểm thi đã được cập nhật thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  eduadmission_menu
}

run_admission_algorithm() {
  clear
  echo "====================================================="
  echo "CHẠY THUẬT TOÁN XÉT TUYỂN"
  echo "====================================================="
  
  execute_msg="{\"run_admission_algorithm\":{}}"
  
  echo "Đang chạy thuật toán xét tuyển..."
  docker exec wasm-node wasmd tx wasm execute ${EDUADMISSION_ADDR} "${execute_msg}" \
    --from validator \
    --chain-id ${CHAIN_ID} \
    --gas ${GAS} \
    --gas-prices ${GAS_PRICES} \
    --keyring-backend test \
    --broadcast-mode block \
    -y
  
  echo "Thuật toán xét tuyển đã chạy thành công!"
  echo "Nhấn Enter để tiếp tục..."
  read
  eduadmission_menu
}

view_admission_results() {
  clear
  echo "====================================================="
  echo "XEM KẾT QUẢ TUYỂN SINH"
  echo "====================================================="
  echo -n "Nhập địa chỉ thí sinh (để trống để xem tất cả): "
  read student
  
  if [ -z "$student" ]; then
    query_msg="{\"admission_results\":{}}"
  else
    query_msg="{\"admission_results\":{\"student\":\"$student\"}}"
  fi
  
  echo "Đang lấy kết quả tuyển sinh..."
  docker exec wasm-node wasmd query wasm contract-state smart ${EDUADMISSION_ADDR} "${query_msg}" --output json
  
  echo "Nhấn Enter để tiếp tục..."
  read
  eduadmission_menu
}

# Chạy menu chính
show_menu
