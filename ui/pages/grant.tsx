import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function Grant() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [metadata, setMetadata] = useState('');
  const [issuer, setIssuer] = useState('');
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');
  const [nodeInfo, setNodeInfo] = useState<any>(null);
  const [hashing, setHashing] = useState(false);

  useEffect(() => {
    // Lấy thông tin node hiện tại từ API
    fetch(`${API_BASE_URL}/api/nodeinfo`)
      .then(res => res.json())
      .then(data => {
        setNodeInfo(data.current_node);
        setIssuer(data.current_node?.id || '');
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

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <h2>Cấp Bằng (Credential) Cho Đối Tượng</h2>
      {nodeInfo && (
        <div style={{ marginBottom: 16, background: '#f8f8f8', borderRadius: 8, padding: 12 }}>
          <b>Node hiện tại:</b> {nodeInfo.name || nodeInfo.id} <br />
          <b>Địa chỉ:</b> {nodeInfo.address || 'N/A'} <br />
          <b>Issuer (ID):</b> {issuer} <br />
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>1. Upload file bằng cấp (PDF, JSON, ...):</label>
        <input type="file" onChange={handleFileChange} accept=".pdf,.json,.jpg,.jpeg,.png,.doc,.docx" title="Chọn file PDF, JSON, ảnh hoặc Word của bằng cấp để hệ thống tự động tính hash" />
        {hashing && <span style={{ marginLeft: 8 }}>Đang tính hash...</span>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>2. Hash của file bằng cấp:</label>
        <input type="text" placeholder="Hash của file bằng cấp (tự động sinh khi upload file hoặc nhập thủ công nếu có)" value={hash} onChange={e => setHash(e.target.value)} style={{ width: 320 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>3. Metadata (ví dụ: Bằng Cử nhân CNTT, 2025):</label>
        <input type="text" placeholder="Nhập thông tin về bằng cấp, ví dụ: Bằng Cử nhân CNTT, 2025" value={metadata} onChange={e => setMetadata(e.target.value)} style={{ width: 320 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>4. Signature (chữ ký số):</label>
        <input type="text" placeholder="Chữ ký số của node cấp bằng (signature)" value={signature} onChange={e => setSignature(e.target.value)} style={{ width: 320 }} />
      </div>
      <button onClick={handleGrant} disabled={!hash || !metadata || !issuer || !signature || hashing} style={{ marginTop: 8 }}>
        Cấp Bằng
      </button>
      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
}
