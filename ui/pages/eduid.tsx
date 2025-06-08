import { useState } from 'react';

export default function EduID() {
  const [did, setDid] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [serviceEndpoint, setServiceEndpoint] = useState('');
  const [result, setResult] = useState<any>(null);
  const [hash, setHash] = useState('');
  const [mode, setMode] = useState<'register'|'update'|'query'|'hash'>('register');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    setMessage('');
    setResult(null);
    try {
      const res = await fetch('/api/edu-id/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, public_key: publicKey, service_endpoint: serviceEndpoint })
      });
      const data = await res.json();
      setResult(data);
      setMessage(data.success ? 'Đăng ký DID thành công!' : data.detail || 'Lỗi đăng ký DID');
    } catch (e) {
      setMessage('Lỗi khi gọi API đăng ký DID');
    }
  };

  const handleUpdate = async () => {
    setMessage('');
    setResult(null);
    try {
      const res = await fetch('/api/edu-id/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, public_key: publicKey, service_endpoint: serviceEndpoint })
      });
      const data = await res.json();
      setResult(data);
      setMessage(data.success ? 'Cập nhật DID thành công!' : data.detail || 'Lỗi cập nhật DID');
    } catch (e) {
      setMessage('Lỗi khi gọi API cập nhật DID');
    }
  };

  const handleQuery = async () => {
    setMessage('');
    setResult(null);
    try {
      const res = await fetch(`/api/edu-id/get_did?did=${encodeURIComponent(did)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setMessage('Truy vấn DID thành công!');
      } else {
        setMessage('Không tìm thấy DID!');
      }
    } catch (e) {
      setMessage('Lỗi khi truy vấn DID');
    }
  };

  const handleGetHash = async () => {
    setMessage('');
    setResult(null);
    try {
      const res = await fetch(`/api/edu-id/get_did_hash?did=${encodeURIComponent(did)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setMessage('Lấy hash DID thành công!');
      } else {
        setMessage('Không tìm thấy DID!');
      }
    } catch (e) {
      setMessage('Lỗi khi lấy hash DID');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Quản lý Danh tính tự chủ (EduID)</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setMode('register')} style={{ marginRight: 8, background: mode==='register'?'#eee':'' }}>Đăng ký DID</button>
        <button onClick={() => setMode('update')} style={{ marginRight: 8, background: mode==='update'?'#eee':'' }}>Cập nhật DID</button>
        <button onClick={() => setMode('query')} style={{ marginRight: 8, background: mode==='query'?'#eee':'' }}>Tra cứu DID</button>
        <button onClick={() => setMode('hash')} style={{ background: mode==='hash'?'#eee':'' }}>Lấy hash DID</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input type="text" placeholder="DID (ví dụ: did:example:123)" value={did} onChange={e => setDid(e.target.value)} style={{ width: 300 }} />
      </div>
      {(mode==='register'||mode==='update') && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input type="text" placeholder="Public Key" value={publicKey} onChange={e => setPublicKey(e.target.value)} style={{ width: 300 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input type="text" placeholder="Service Endpoint (tùy chọn)" value={serviceEndpoint} onChange={e => setServiceEndpoint(e.target.value)} style={{ width: 300 }} />
          </div>
        </>
      )}
      <div style={{ marginBottom: 16 }}>
        {mode==='register' && <button onClick={handleRegister} disabled={!did || !publicKey}>Đăng ký DID</button>}
        {mode==='update' && <button onClick={handleUpdate} disabled={!did}>Cập nhật DID</button>}
        {mode==='query' && <button onClick={handleQuery} disabled={!did}>Tra cứu DID</button>}
        {mode==='hash' && <button onClick={handleGetHash} disabled={!did}>Lấy hash DID</button>}
      </div>
      {message && <p>{message}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
