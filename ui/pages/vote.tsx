import { useState } from 'react';

export default function Vote() {
  const [hash, setHash] = useState('');
  const [approve, setApprove] = useState(true);
  const [message, setMessage] = useState('');

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
