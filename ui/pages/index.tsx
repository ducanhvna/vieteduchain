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
      </ul>
      <p>Chọn chức năng phù hợp với quyền hạn node của bạn.</p>
    </div>
  );
}
