import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function EduID() {
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
      const res = await fetch(`${API_BASE_URL}/api/edu-id/register`, {
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
      const res = await fetch(`${API_BASE_URL}/api/edu-id/update`, {
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
      const res = await fetch(`${API_BASE_URL}/api/edu-id/get_did?did=${encodeURIComponent(did)}`);
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
      const res = await fetch(`${API_BASE_URL}/api/edu-id/get_did_hash?did=${encodeURIComponent(did)}`);
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

  // Liệt kê tất cả DID
  const handleList = async () => {
    setMessage('');
    setList([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/edu-id/list`);
      const data = await res.json();
      if (res.ok) setList(data);
      else setMessage('Không lấy được danh sách DID');
    } catch {
      setMessage('Lỗi kết nối backend');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Quản lý Danh tính tự chủ (EduID)</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setMode('register')} style={{ marginRight: 8, background: mode==='register'?'#eee':'' }}>Đăng ký DID</button>
        <button onClick={() => setMode('update')} style={{ marginRight: 8, background: mode==='update'?'#eee':'' }}>Cập nhật DID</button>
        <button onClick={() => setMode('query')} style={{ marginRight: 8, background: mode==='query'?'#eee':'' }}>Tra cứu DID</button>
        <button onClick={() => setMode('hash')} style={{ marginRight: 8, background: mode==='hash'?'#eee':'' }}>Lấy hash DID</button>
        <button onClick={handleList} style={{ background: list.length>0?'#eee':'' }}>Liệt kê tất cả DID</button>
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
      {list.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3>Danh sách DID đã đăng ký</h3>
          <table style={{ width: '100%', background: '#fff', borderRadius: 6 }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th style={{ padding: 6 }}>DID</th>
                <th style={{ padding: 6 }}>Public Key</th>
                <th style={{ padding: 6 }}>Service Endpoint</th>
                <th style={{ padding: 6 }}>@context</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 6 }}>{item.did}</td>
                  <td style={{ padding: 6 }}>{item.did_doc.public_key}</td>
                  <td style={{ padding: 6 }}>{item.did_doc.service_endpoint}</td>
                  <td style={{ padding: 6 }}>{item.did_doc['@context']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
