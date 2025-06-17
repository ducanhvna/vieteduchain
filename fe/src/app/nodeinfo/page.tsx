"use client";
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, Typography, List, Button, Input, Alert, Spin, Table, Space } from 'antd';

interface NodeProfile {
  id: string;
  name?: string;
  address?: string;
}

export default function Page() {
  const [nodeinfo, setNodeinfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [credentialHash, setCredentialHash] = useState('');
  const [credential, setCredential] = useState<any>(null);
  const [credMessage, setCredMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    async function fetchNodeinfo() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/nodeinfo`);
        if (!res.ok) throw new Error('Không lấy được thông tin node');
        const data = await res.json();
        setNodeinfo(data);
      } catch (e: any) {
        setError(e.message || 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    }
    fetchNodeinfo();
  }, []);

  const handleSelectNode = (nodeId: string) => {
    setSelectedNode(nodeId);
    setCredential(null);
    setCredMessage('');
  };

  const handleCheckCredential = async () => {
    setCredMessage('');
    setCredential(null);
    if (!credentialHash) return;
    try {
      const res = await fetch(`/api/edu-cert/get_credential?hash=${encodeURIComponent(credentialHash)}`);
      if (res.ok) {
        const data = await res.json();
        setCredential(data);
        setCredMessage('Đã tìm thấy credential!');
      } else {
        setCredMessage('Không tìm thấy credential!');
      }
    } catch {
      setCredMessage('Lỗi khi xác thực credential');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    setUploadMessage('');
    if (!file) return;
    setUploadMessage(`Đã chọn file: ${file.name} (demo, chưa gửi lên backend)`);
  };

  const grantedNodes: NodeProfile[] = nodeinfo?.granted_nodes || [];
  const currentNode: NodeProfile | null = nodeinfo?.current_node || null;
  const currentPermission: boolean = nodeinfo?.current_permission || false;

  return (
    <Card style={{ padding: 32, maxWidth: 1000, margin: '32px auto' }}>
      <Typography.Title level={3}>Thông tin node & tra cứu bằng cấp</Typography.Title>
      <Space align="start" size={32} style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
        {/* Danh sách node */}
        <Card title="Danh sách node có quyền" style={{ flex: 1, minWidth: 260 }}>
          {loading && <Spin />}
          {error && <Alert type="error" message={error} />}
          {!loading && !error && (
            <List
              dataSource={grantedNodes}
              locale={{ emptyText: 'Chưa có node nào có quyền.' }}
              renderItem={node => (
                <List.Item>
                  <Button
                    type={selectedNode === node.id ? 'primary' : 'default'}
                    onClick={() => handleSelectNode(node.id)}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    {node.name || node.id} {node.address ? `(${node.address})` : ''}
                  </Button>
                </List.Item>
              )}
            />
          )}
          <Typography.Paragraph type="secondary" style={{marginTop:16, fontSize:13}}>Danh sách lấy từ API /api/nodeinfo.</Typography.Paragraph>
        </Card>
        {/* Thông tin node hiện tại */}
        <Card title="Node hiện tại (profile)" style={{ flex: 1, minWidth: 260 }}>
          {currentNode ? (
            <>
              <div><b>ID:</b> {currentNode.id}</div>
              {currentNode.name && <div><b>Tên:</b> {currentNode.name}</div>}
              {currentNode.address && <div><b>Địa chỉ:</b> {currentNode.address}</div>}
              <div><b>Quyền cấp bằng:</b> {currentPermission ? <span style={{color:'#090'}}>ĐƯỢC CẤP</span> : <span style={{color:'#c00'}}>KHÔNG ĐƯỢC CẤP</span>}</div>
            </>
          ) : <Typography.Text type="secondary">Chưa có thông tin node hiện tại.</Typography.Text>}
        </Card>
        {/* Tra cứu bằng cấp */}
        <Card title="Tra cứu/Xác thực Bằng (Credential)" style={{ flex: 2, minWidth: 320 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Nhập Hash (Node ID)"
              value={credentialHash}
              onChange={e => setCredentialHash(e.target.value)}
              style={{ width: 220, marginRight: 8 }}
            />
            <Button onClick={handleCheckCredential} disabled={!credentialHash}>Tra cứu</Button>
            {credMessage && <Typography.Paragraph>{credMessage}</Typography.Paragraph>}
            {credential && (
              <Card type="inner" title="Thông tin Credential" style={{ marginTop: 8 }}>
                <Table
                  dataSource={[
                    { key: 'hash', label: 'Hash', value: credential.hash },
                    { key: 'issuer', label: 'Issuer', value: credential.issuer },
                    { key: 'metadata', label: 'Metadata', value: credential.metadata },
                    { key: 'signature', label: 'Signature', value: credential.signature },
                  ]}
                  columns={[
                    { title: 'Trường', dataIndex: 'label', key: 'label' },
                    { title: 'Giá trị', dataIndex: 'value', key: 'value' },
                  ]}
                  pagination={false}
                  showHeader={false}
                  style={{ marginBottom: 8 }}
                />
                <details>
                  <summary>Xem JSON đầy đủ</summary>
                  <pre style={{ background: '#fff', padding: 8, borderRadius: 4 }}>{JSON.stringify(credential, null, 2)}</pre>
                </details>
              </Card>
            )}
            <hr style={{ margin: '24px 0' }} />
            <Typography.Title level={5}>Upload file bằng cấp để xác thực (demo)</Typography.Title>
            <Input type="file" onChange={handleFileChange} style={{ maxWidth: 300 }} />
            <Button onClick={handleUpload} disabled={!file}>Upload</Button>
            {uploadMessage && <Typography.Paragraph>{uploadMessage}</Typography.Paragraph>}
            <Typography.Paragraph type="secondary" style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
              Tính năng upload file chỉ demo, chưa gửi lên backend.
            </Typography.Paragraph>
          </Space>
        </Card>
      </Space>
    </Card>
  );
}
