import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [credential, setCredential] = useState<any>(null);
  const [revoked, setRevoked] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [hashing, setHashing] = useState(false);

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

  const handleCheck = async () => {
    if (!hash) return;
    setMessage('');
    setCredential(null);
    setRevoked(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/edu-cert/get_credential?hash=${encodeURIComponent(hash)}`);
      if (res.ok) {
        const data = await res.json();
        setCredential(data);
        setMessage('Đã tìm thấy credential!');
        // Check revoked
        const res2 = await fetch(`${API_BASE_URL}/api/edu-cert/is_revoked?hash=${encodeURIComponent(hash)}`);
        if (res2.ok) {
          const data2 = await res2.json();
          setRevoked(data2.revoked);
        }
      } else {
        setCredential(null);
        setMessage('Không tìm thấy credential!');
      }
    } catch (e) {
      setMessage('Lỗi khi xác thực credential');
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h2>Tra cứu/Xác thực Bằng (Credential)</h2>
      <p style={{color:'#555', marginBottom:12}}>
        Upload file bằng cấp (PDF, JSON, ...) hoặc nhập <b>hash</b> của file để xác thực bằng cấp này có phải là bằng thật đã được cấp bởi một node hợp lệ trong hệ thống hay không.
      </p>
      <div style={{ marginBottom: 16 }}>
        <input type="file" onChange={handleFileChange} accept=".pdf,.json,.jpg,.jpeg,.png,.doc,.docx" />
        {hashing && <span style={{ marginLeft: 8 }}>Đang tính hash...</span>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <input type="text" placeholder="Nhập Hash của file bằng cấp" value={hash} onChange={e => setHash(e.target.value)} style={{ width: 340 }} />
        <button onClick={handleCheck} disabled={!hash || hashing} style={{ marginLeft: 8 }}>
          Tra cứu
        </button>
      </div>
      {message && <p>{message}</p>}
      {credential && (
        <div style={{ marginTop: 16, background: '#f8f8f8', borderRadius: 8, padding: 16 }}>
          <h4>Thông tin Credential</h4>
          <table style={{ width: '100%', marginBottom: 8 }}>
            <tbody>
              <tr><td><b>Hash</b></td><td>{credential.hash}</td></tr>
              <tr><td><b>Issuer</b></td><td>{credential.issuer}</td></tr>
              <tr><td><b>Metadata</b></td><td>{credential.metadata}</td></tr>
              <tr><td><b>Signature</b></td><td style={{ wordBreak: 'break-all' }}>{credential.signature}</td></tr>
              <tr><td><b>Trạng thái</b></td><td>{revoked ? <span style={{color:'#c00'}}>ĐÃ THU HỒI</span> : <span style={{color:'#090'}}>CÒN HIỆU LỰC</span>}</td></tr>
            </tbody>
          </table>
          <details>
            <summary>Xem JSON đầy đủ</summary>
            <pre style={{ background: '#fff', padding: 8, borderRadius: 4 }}>{JSON.stringify(credential, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
