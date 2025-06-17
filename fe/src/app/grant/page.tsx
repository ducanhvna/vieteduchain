"use client";

import { useState, useEffect } from 'react';
import { Card, Input, Button, Form, Typography, Alert, Spin } from 'antd';
import { API_BASE_URL } from '@/config';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [metadata, setMetadata] = useState('');
  const [issuer, setIssuer] = useState('');
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');
  const [nodeInfo, setNodeInfo] = useState<any>(null);
  const [hashing, setHashing] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<boolean>(false);

  useEffect(() => {
    // Lấy thông tin node hiện tại từ API
    fetch(`${API_BASE_URL}/api/nodeinfo`)
      .then(res => res.json())
      .then(data => {
        setNodeInfo(data.current_node);
        setIssuer(data.current_node?.id || '');
        setCurrentPermission(data.current_permission || false);
      });
  }, []);

  // Tính hash SHA-256 của file (dạng hex)
  const computeFileHash = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setHashing(true);
      try {
        const h = await computeFileHash(f);
        setHash(h);
        setMessage('Đã tính hash file: ' + h);
      } catch {
        setMessage('Không thể tính hash file');
      }
      setHashing(false);
    }
  };

  const handleGrant = async () => {
    if (!hash || !metadata || !issuer || !signature) return;
    try {
      const res = await fetch('/api/edu-cert/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, metadata, issuer, signature })
      });
      const data = await res.json();
      setMessage(data.message || JSON.stringify(data));
    } catch (e) {
      setMessage('Lỗi khi gọi API cấp bằng');
    }
  };

  if (!currentPermission) {
    return (
      <Card style={{ padding: 32, maxWidth: 700, margin: '32px auto', color: '#c00', fontWeight: 500 }}>
        <Typography.Title level={3}>Cấp Bằng (Credential)</Typography.Title>
        <Alert type="error" showIcon message="Node hiện tại KHÔNG có quyền cấp bằng. Vui lòng liên hệ node granting để được vote cấp quyền." />
      </Card>
    );
  }

  return (
    <Card style={{ padding: 32, maxWidth: 700, margin: '32px auto' }}>
      <Typography.Title level={3}>Cấp Bằng (Credential) Cho Đối Tượng</Typography.Title>
      {nodeInfo && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <div>
              <b>Node hiện tại:</b> {nodeInfo.name || nodeInfo.id} <br />
              <b>Địa chỉ:</b> {nodeInfo.address || 'N/A'} <br />
              <b>Issuer (ID):</b> {issuer} <br />
            </div>
          }
        />
      )}
      <Form layout="vertical" onFinish={handleGrant}>
        <Form.Item label="1. Upload file bằng cấp (PDF, JSON, ...):">
          <Input type="file" onChange={handleFileChange} accept=".pdf,.json,.jpg,.jpeg,.png,.doc,.docx" />
          {hashing && <Spin style={{ marginLeft: 8 }} />}
        </Form.Item>
        <Form.Item label="2. Hash của file bằng cấp:">
          <Input value={hash} onChange={e => setHash(e.target.value)} placeholder="Hash của file bằng cấp (tự động sinh khi upload file hoặc nhập thủ công nếu có)" style={{ width: 320 }} />
        </Form.Item>
        <Form.Item label="3. Metadata (ví dụ: Bằng Cử nhân CNTT, 2025):">
          <Input value={metadata} onChange={e => setMetadata(e.target.value)} placeholder="Nhập thông tin về bằng cấp, ví dụ: Bằng Cử nhân CNTT, 2025" style={{ width: 320 }} />
        </Form.Item>
        <Form.Item label="4. Signature (chữ ký số):">
          <Input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Chữ ký số của node cấp bằng (signature)" style={{ width: 320 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={!hash || !metadata || !issuer || !signature || hashing}>Cấp Bằng</Button>
        </Form.Item>
      </Form>
      {message && <Typography.Paragraph style={{ marginTop: 16 }}>{message}</Typography.Paragraph>}
    </Card>
  );
}
