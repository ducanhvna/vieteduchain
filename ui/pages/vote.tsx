import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function Vote() {
  const [hash, setHash] = useState('');
  const [approve, setApprove] = useState(true);
  const [message, setMessage] = useState('');
  const [currentPermission, setCurrentPermission] = useState<boolean>(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/nodeinfo`)
      .then(res => res.json())
      .then(data => setCurrentPermission(data.current_permission || false));
  }, []);

  const handleVote = async () => {
    if (!hash) return;
    try {
      const res = await fetch('/api/edu-cert/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash })
      });
      const data = await res.json();
      setMessage(data.message || JSON.stringify(data));
    } catch (e) {
      setMessage('Lỗi khi gọi API thu hồi');
    }
  };

  if (!currentPermission) {
    return (
      <div style={{ padding: 32, color: '#c00', fontWeight: 500 }}>
        <h2>Biểu Quyết (Vote)</h2>
        <p>Node hiện tại <b>KHÔNG có quyền vote cấp quyền</b>. Vui lòng liên hệ granting node để được vote.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Thu Hồi Bằng (Revoke Credential)</h2>
      <input
        type="text"
        placeholder="Nhập Hash (Node ID)"
        value={hash}
        onChange={e => setHash(e.target.value)}
      />
      <button onClick={handleVote} disabled={!hash} style={{ marginLeft: 8 }}>
        Thu Hồi
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
