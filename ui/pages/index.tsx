import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Permissioned Network Dashboard</h1>
      <ul>
        <li><Link href="/upload">Upload Bằng (Xác thực)</Link></li>
        <li><Link href="/grant">Cấp Bằng (Chỉ node có quyền)</Link></li>
        <li><Link href="/vote">Biểu Quyết (Chỉ node có quyền)</Link></li>
        <li><Link href="/eduid">Quản lý Danh tính tự chủ (EduID)</Link></li>
        <li><Link href="/edupay">Thanh toán học phí & học bổng (EduPay)</Link></li>
        <li><Link href="/researchledger">ResearchLedger – Chống đạo văn</Link></li>
        <li><Link href="/nodeinfo">Thông tin node (danh sách node có quyền)</Link></li>
      </ul>
      <p>Chọn chức năng phù hợp với quyền hạn node của bạn.</p>
    </div>
  );
}
