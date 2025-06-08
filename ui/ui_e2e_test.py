import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Thiết lập Chrome headless cho CI hoặc máy không có GUI
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

def test_ui_dashboard():
    driver = webdriver.Chrome(options=chrome_options)
    try:
        driver.get('http://localhost:3179')
        assert 'Permissioned Network Dashboard' in driver.page_source
        # Kiểm tra các menu chính
        assert driver.find_element(By.LINK_TEXT, 'Tuyển sinh minh bạch (EduAdmission)')
        assert driver.find_element(By.LINK_TEXT, 'Quản lý Danh tính tự chủ (EduID)')
        assert driver.find_element(By.LINK_TEXT, 'Thanh toán học phí & học bổng (EduPay)')
        assert driver.find_element(By.LINK_TEXT, 'ResearchLedger – Chống đạo văn')
        assert driver.find_element(By.LINK_TEXT, 'EduMarket – Course NFT Marketplace')
        # Kiểm tra trạng thái quyền cấp bằng (có thể là ĐƯỢC CẤP hoặc KHÔNG ĐƯỢC CẤP)
        time.sleep(1)  # Đợi fetch API
        assert 'Quyền cấp bằng:' in driver.page_source
    finally:
        driver.quit()
