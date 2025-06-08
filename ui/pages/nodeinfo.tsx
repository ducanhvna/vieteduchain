import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

interface NodeProfile {
  id: string;
  name?: string;
  address?: string;
}

export default function NodeInfo() {
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
        const res = await fetch(`${API_BASE_URL}/api/nodeinfo`); // Sửa lại đúng endpoint
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
              {grantedNodes.length === 0 && <li>Chưa có node nào có quyền.</li>}
              {grantedNodes.map(node => (
                <li key={node.id} style={{ marginBottom: 4 }}>
                  <button style={{ background: selectedNode === node.id ? '#d0eaff' : '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }} onClick={() => handleSelectNode(node.id)}>
                    {node.name || node.id} {node.address ? `(${node.address})` : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p style={{marginTop:16, color:'#888', fontSize:13}}>Danh sách lấy từ API /api/nodeinfo.</p>
        </div>
        {/* Thông tin node hiện tại */}
        <div style={{ flex: 1, minWidth: 260, background: '#f8f8f8', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #eee' }}>
          <h3 style={{ marginTop: 0 }}>Node hiện tại (profile)</h3>
          {currentNode ? (
            <div>
              <div><b>ID:</b> {currentNode.id}</div>
              {currentNode.name && <div><b>Tên:</b> {currentNode.name}</div>}
              {currentNode.address && <div><b>Địa chỉ:</b> {currentNode.address}</div>}
              <div><b>Quyền cấp bằng:</b> {currentPermission ? <span style={{color:'#009900'}}>Được cấp quyền</span> : <span style={{color:'#c00'}}>Chưa có quyền</span>}</div>
            </div>
          ) : <div>Không xác định node hiện tại (NODE_ID).</div>}
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
