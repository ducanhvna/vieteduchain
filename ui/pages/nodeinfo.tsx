import { useEffect, useState } from 'react';

export default function NodeInfo() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [credentialHash, setCredentialHash] = useState('');
  const [credential, setCredential] = useState<any>(null);
  const [credMessage, setCredMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    async function fetchPermissions() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/permissions');
        if (!res.ok) throw new Error('Không lấy được danh sách node');
        const data = await res.json();
        setPermissions(data);
      } catch (e: any) {
        setError(e.message || 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    }
    fetchPermissions();
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
    // Demo: chỉ hiển thị tên file, không upload thực tế
    setUploadMessage(`Đã chọn file: ${file.name} (demo, chưa gửi lên backend)`);
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>Thông tin node &amp; tra cứu bằng cấp</h2>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Danh sách node */}
        <div style={{ flex: 1, minWidth: 260, background: '#f8f8f8', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #eee' }}>
          <h3 style={{ marginTop: 0 }}>Danh sách node có quyền</h3>
          {loading && <p>Đang tải...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && (
            <ul style={{ paddingLeft: 18 }}>
              {permissions.length === 0 && <li>Chưa có node nào có quyền.</li>}
              {permissions.map(nodeId => (
                <li key={nodeId} style={{ marginBottom: 4 }}>
                  <button style={{ background: selectedNode === nodeId ? '#d0eaff' : '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }} onClick={() => handleSelectNode(nodeId)}>{nodeId}</button>
                </li>
              ))}
            </ul>
          )}
          <p style={{marginTop:16, color:'#888', fontSize:13}}>Danh sách lấy từ API /api/permissions.</p>
        </div>
        {/* Tra cứu bằng cấp */}
        <div style={{ flex: 2, minWidth: 320, background: '#f8f8f8', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #eee' }}>
          <h3 style={{ marginTop: 0 }}>Tra cứu/Xác thực Bằng (Credential)</h3>
          <div style={{ marginBottom: 12 }}>
            <input type="text" placeholder="Nhập Hash (Node ID)" value={credentialHash} onChange={e => setCredentialHash(e.target.value)} style={{ width: 220, marginRight: 8 }} />
            <button onClick={handleCheckCredential} disabled={!credentialHash}>Tra cứu</button>
          </div>
          {credMessage && <p>{credMessage}</p>}
          {credential && (
            <div style={{ marginTop: 8 }}>
              <pre style={{ background: '#fff', padding: 8, borderRadius: 4 }}>{JSON.stringify(credential, null, 2)}</pre>
            </div>
          )}
          <hr style={{ margin: '24px 0' }} />
          <h4>Upload file bằng cấp để xác thực (demo)</h4>
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload} disabled={!file} style={{ marginLeft: 8 }}>Upload</button>
          {uploadMessage && <p>{uploadMessage}</p>}
          <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>Tính năng upload file chỉ demo, chưa gửi lên backend.</p>
        </div>
      </div>
    </div>
  );
}
