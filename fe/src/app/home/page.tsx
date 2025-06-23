"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/config';
import { Card, Typography, List, Spin } from 'antd';
import type { ListProps } from 'antd';
import ContractWidget from '@/components/contract-widget';

interface MenuItem {
  label: React.ReactNode;
  key: string;
  permission: boolean;
}

export default function Page() {
  const [currentPermission, setCurrentPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/nodeinfo`)
      .then(res => res.json())
      .then(data => setCurrentPermission(data.current_permission || false))
      .finally(() => setLoading(false));
  }, []);

  const menuItems: MenuItem[] = [
    {
      label: <Link href="/upload">Upload Bằng (Xác thực)</Link>,
      key: 'upload',
      permission: true,
    },
    {
      label: currentPermission ? <Link href="/grant">Cấp Bằng (Chỉ node có quyền)</Link> : <span style={{ color: '#aaa' }}>Cấp Bằng (Chỉ node có quyền)</span>,
      key: 'grant',
      permission: true,
    },
    {
      label: currentPermission ? <Link href="/vote">Biểu Quyết (Chỉ node có quyền)</Link> : <span style={{ color: '#aaa' }}>Biểu Quyết (Chỉ node có quyền)</span>,
      key: 'vote',
      permission: true,
    },
    {
      label: <Link href="/eduid">Quản lý Danh tính tự chủ (EduID)</Link>,
      key: 'eduid',
      permission: true,
    },
    {
      label: <Link href="/edupay">Thanh toán học phí & học bổng (EduPay)</Link>,
      key: 'edupay',
      permission: true,
    },
    {
      label: <Link href="/researchledger">ResearchLedger – Chống đạo văn</Link>,
      key: 'researchledger',
      permission: true,
    },
    {
      label: <Link href="/nodeinfo">Thông tin node (danh sách node có quyền)</Link>,
      key: 'nodeinfo',
      permission: true,
    },
    {
      label: <Link href="/eduadmission">Tuyển sinh minh bạch (EduAdmission)</Link>,
      key: 'eduadmission',
      permission: true,
    },
    {
      label: <Link href="/edumarket">EduMarket – Course NFT Marketplace</Link>,
      key: 'edumarket',
      permission: true,
    },
  ];

  return (
    <Card style={{ padding: 32, maxWidth: 700, margin: '32px auto' }}>
      <Typography.Title level={2}>Permissioned Network Dashboard</Typography.Title>
      {loading ? (
        <Spin style={{ margin: '32px auto', display: 'block' }} />
      ) : (
        <List
          dataSource={menuItems}
          renderItem={(item: MenuItem) => <List.Item>{item.label}</List.Item>}
          style={{ marginBottom: 24 }}
        />
      )}
      <Typography.Paragraph>Chọn chức năng phù hợp với quyền hạn node của bạn.</Typography.Paragraph>
      {!loading && (
        <Typography.Paragraph style={{marginTop:16, color: currentPermission ? '#090' : '#c00', fontWeight:500}}>
          Quyền cấp bằng: {currentPermission ? 'ĐƯỢC CẤP' : 'KHÔNG ĐƯỢC CẤP'}
        </Typography.Paragraph>
      )}
      <ContractWidget maxDisplay={3} title="Smart Contracts mới" />
    </Card>
  );
}
