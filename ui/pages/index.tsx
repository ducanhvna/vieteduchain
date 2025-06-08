import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '../config';

export default function Home() {
  const [currentPermission, setCurrentPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/nodeinfo`)
      .then(res => res.json())
      .then(data => setCurrentPermission(data.current_permission || false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1>Permissioned Network Dashboard</h1>
      <ul>
        <li><Link href="/upload">Upload Bằng (Xác thực)</Link></li>
        <li>
          {loading ? '...' : currentPermission ? (
            <Link href="/grant">Cấp Bằng (Chỉ node có quyền)</Link>
          ) : (
            <span style={{ color: '#aaa' }}>Cấp Bằng (Chỉ node có quyền)</span>
          )}
        </li>
        <li>
          {loading ? '...' : currentPermission ? (
            <Link href="/vote">Biểu Quyết (Chỉ node có quyền)</Link>
          ) : (
            <span style={{ color: '#aaa' }}>Biểu Quyết (Chỉ node có quyền)</span>
          )}
        </li>
        <li><Link href="/eduid">Quản lý Danh tính tự chủ (EduID)</Link></li>
        <li><Link href="/edupay">Thanh toán học phí & học bổng (EduPay)</Link></li>
        <li><Link href="/researchledger">ResearchLedger – Chống đạo văn</Link></li>
        <li><Link href="/nodeinfo">Thông tin node (danh sách node có quyền)</Link></li>
        <li><Link href="/eduadmission">Tuyển sinh minh bạch (EduAdmission)</Link></li>
        <li><Link href="/edumarket">EduMarket – Course NFT Marketplace</Link></li>
      </ul>
      <p>Chọn chức năng phù hợp với quyền hạn node của bạn.</p>
      {!loading && (
        <div style={{marginTop:16, color: currentPermission ? '#090' : '#c00', fontWeight:500}}>
          Quyền cấp bằng: {currentPermission ? 'ĐƯỢC CẤP' : 'KHÔNG ĐƯỢC CẤP'}
        </div>
      )}
    </div>
  );
}
