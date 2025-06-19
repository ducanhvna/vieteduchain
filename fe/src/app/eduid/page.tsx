"use client";

import { useState } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, Button, Input, Tabs, Table, message as antdMessage, Space, Typography } from 'antd';

const { Paragraph } = Typography;

export default function Page() {
  const [did, setDid] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [serviceEndpoint, setServiceEndpoint] = useState('');
  const [result, setResult] = useState<any>(null);
  const [hash, setHash] = useState('');
  const [mode, setMode] = useState<'register'|'update'|'query'|'hash'>('register');
  const [message, setMessage] = useState('');
  const [list, setList] = useState<any[]>([]);

  const handleRegister = async () => {
    setMessage('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/edu-id/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_req: {
            from: "owner_address",
            chain_id: "educhain-1"
          },
          did_doc: {
            context: "https://www.w3.org/ns/did/v1",
            did: did,
            public_key: publicKey,
            service_endpoint: serviceEndpoint
          }
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.txhash) {
        setMessage('Đăng ký DID thành công!');
        antdMessage.success('Đăng ký DID thành công!');
      } else {
        setMessage(data.detail || 'Lỗi đăng ký DID');
        antdMessage.error(data.detail || 'Lỗi đăng ký DID');
      }
    } catch (e) {
      setMessage('Lỗi khi gọi API đăng ký DID');
      antdMessage.error('Lỗi khi gọi API đăng ký DID');
    }
  };

  const handleUpdate = async () => {
    setMessage('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/edu-id/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_req: {
            from: "owner_address",
            chain_id: "educhain-1"
          },
          did_doc: {
            context: "https://www.w3.org/ns/did/v1",
            did: did,
            public_key: publicKey,
            service_endpoint: serviceEndpoint
          }
        })
      });
      const data = await res.json();
      setResult(data);
      if (data.txhash) {
        setMessage('Cập nhật DID thành công!');
        antdMessage.success('Cập nhật DID thành công!');
      } else {
        setMessage(data.detail || 'Lỗi cập nhật DID');
        antdMessage.error(data.detail || 'Lỗi cập nhật DID');
      }
    } catch (e) {
      setMessage('Lỗi khi gọi API cập nhật DID');
      antdMessage.error('Lỗi khi gọi API cập nhật DID');
    }
  };

  const handleQuery = async () => {
    setMessage('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/edu-id/did/${encodeURIComponent(did)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setMessage('Truy vấn DID thành công!');
        antdMessage.success('Truy vấn DID thành công!');
      } else {
        setMessage('Không tìm thấy DID!');
        antdMessage.error('Không tìm thấy DID!');
      }
    } catch (e) {
      setMessage('Lỗi khi truy vấn DID');
      antdMessage.error('Lỗi khi truy vấn DID');
    }
  };

  const handleGetHash = async () => {
    setMessage('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/edu-id/hash/${encodeURIComponent(did)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setMessage('Lấy hash DID thành công!');
        antdMessage.success('Lấy hash DID thành công!');
      } else {
        setMessage('Không tìm thấy DID!');
        antdMessage.error('Không tìm thấy DID!');
      }
    } catch (e) {
      setMessage('Lỗi khi lấy hash DID');
      antdMessage.error('Lỗi khi lấy hash DID');
    }
  };

  // Liệt kê tất cả DID
  const handleList = async () => {
    setMessage('');
    setList([]);
    try {
      const res = await fetch(`${API_BASE_URL}/edu-id/list`);
      const data = await res.json();
      if (res.ok) setList(data);
      else {
        setMessage('Không lấy được danh sách DID');
        antdMessage.error('Không lấy được danh sách DID');
      }
    } catch {
      setMessage('Lỗi kết nối backend');
      antdMessage.error('Lỗi kết nối backend');
    }
  };

  return (
    <Card style={{ maxWidth: 700, margin: '32px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Quản lý Danh tính tự chủ (EduID)</h2>
      <Tabs
        activeKey={mode}
        onChange={key => setMode(key as typeof mode)}
        items={[
          {
            key: 'register',
            label: 'Đăng ký DID',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="DID (ví dụ: did:example:123)" value={did} onChange={e => setDid(e.target.value)} />
                <Input placeholder="Public Key" value={publicKey} onChange={e => setPublicKey(e.target.value)} />
                <Input placeholder="Service Endpoint" value={serviceEndpoint} onChange={e => setServiceEndpoint(e.target.value)} />
                <Button type="primary" onClick={handleRegister} disabled={!did || !publicKey || !serviceEndpoint}>Đăng ký</Button>
              </Space>
            ),
          },
          {
            key: 'update',
            label: 'Cập nhật DID',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="DID" value={did} onChange={e => setDid(e.target.value)} />
                <Input placeholder="Public Key" value={publicKey} onChange={e => setPublicKey(e.target.value)} />
                <Input placeholder="Service Endpoint" value={serviceEndpoint} onChange={e => setServiceEndpoint(e.target.value)} />
                <Button type="primary" onClick={handleUpdate} disabled={!did || !publicKey || !serviceEndpoint}>Cập nhật</Button>
              </Space>
            ),
          },
          {
            key: 'query',
            label: 'Tra cứu DID',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="DID" value={did} onChange={e => setDid(e.target.value)} />
                <Button onClick={handleQuery} disabled={!did}>Tra cứu</Button>
                {result && (
                  <Card type="inner" title="Kết quả truy vấn DID" style={{ marginTop: 16 }}>
                    <Paragraph copyable>{JSON.stringify(result, null, 2)}</Paragraph>
                  </Card>
                )}
              </Space>
            ),
          },
          {
            key: 'hash',
            label: 'Lấy hash DID',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="DID" value={did} onChange={e => setDid(e.target.value)} />
                <Button onClick={handleGetHash} disabled={!did}>Lấy hash</Button>
                {result && (
                  <Card type="inner" title="Hash của DID" style={{ marginTop: 16 }}>
                    <Paragraph copyable>{JSON.stringify(result, null, 2)}</Paragraph>
                  </Card>
                )}
              </Space>
            ),
          },
          {
            key: 'list',
            label: 'Liệt kê tất cả DID',
            children: (
              <div>
                <Button onClick={handleList}>Lấy danh sách DID</Button>
                {list.length > 0 && (
                  <Table
                    dataSource={list}
                    columns={[
                      { title: 'DID', dataIndex: 'did', key: 'did' },
                      { title: 'Public Key', dataIndex: 'public_key', key: 'public_key' },
                      { title: 'Service Endpoint', dataIndex: 'service_endpoint', key: 'service_endpoint' },
                    ]}
                    rowKey="did"
                    style={{ marginTop: 16 }}
                    pagination={false}
                  />
                )}
              </div>
            ),
          },
        ]}
      />
      {message && <p style={{marginTop:16}}>{message}</p>}
    </Card>
  );
}
