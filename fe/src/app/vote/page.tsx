"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, Input, Button, Typography, Alert, Space } from 'antd';

const { Title, Paragraph } = Typography;

export default function Page() {
  const [hash, setHash] = useState('');
  const [message, setMessage] = useState('');
  const [currentPermission, setCurrentPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/nodeinfo`)
      .then(res => res.json())
      .then(data => setCurrentPermission(data.current_permission || false));
  }, []);

  const handleVote = async () => {
    if (!hash) return;
    setLoading(true);
    try {
      const res = await fetch('/api/edu-cert/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash })
      });
      const data = await res.json();
      setMessage(data.message || JSON.stringify(data));
    } catch (e) {
      setMessage('Lỗi khi gọi API thu hồi');
    } finally {
      setLoading(false);
    }
  };

  if (!currentPermission) {
    return (
      <Card style={{ maxWidth: 480, margin: '48px auto', borderColor: '#ff7875' }}>
        <Title level={3} style={{ color: '#c00' }}>Biểu Quyết (Vote)</Title>
        <Alert
          message="Node hiện tại KHÔNG có quyền vote cấp quyền. Vui lòng liên hệ granting node để được vote."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 480, margin: '48px auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3}>Thu Hồi Bằng (Revoke Credential)</Title>
        <Input
          placeholder="Nhập Hash (Node ID)"
          value={hash}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setHash(e.target.value)}
          onPressEnter={handleVote}
        />
        <Button type="primary" onClick={handleVote} disabled={!hash} loading={loading}>
          Thu Hồi
        </Button>
        {message && <Alert message={message} type="info" showIcon />}
      </Space>
    </Card>
  );
}
