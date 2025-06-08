import { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [credential, setCredential] = useState<any>(null);
  const [revoked, setRevoked] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCheck = async () => {
    if (!hash) return;
    try {
      const res = await fetch(`/api/edu-cert/get_credential?hash=${encodeURIComponent(hash)}`);
      if (res.ok) {
        const data = await res.json();
        setCredential(data);
        setMessage('Đã tìm thấy credential!');
        // Check revoked
        const res2 = await fetch(`/api/edu-cert/is_revoked?hash=${encodeURIComponent(hash)}`);
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
    <div style={{ padding: 32 }}>
      <h2>Tra cứu/Xác thực Bằng (Credential)</h2>
      <input type="text" placeholder="Nhập Hash (Node ID)" value={hash} onChange={e => setHash(e.target.value)} />
      <button onClick={handleCheck} disabled={!hash} style={{ marginLeft: 8 }}>
        Tra cứu
      </button>
      {message && <p>{message}</p>}
      {credential && (
        <div style={{ marginTop: 16 }}>
          <pre>{JSON.stringify(credential, null, 2)}</pre>
          <p>Trạng thái: <b>{revoked ? 'ĐÃ THU HỒI' : 'CÒN HIỆU LỰC'}</b></p>
        </div>
      )}
    </div>
  );
}
