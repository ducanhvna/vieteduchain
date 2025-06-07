import { useState } from 'react';

export default function Grant() {
  const [nodeId, setNodeId] = useState('');
  const [message, setMessage] = useState('');

  const handleGrant = async () => {
    if (!nodeId) return;
    // TODO: Gọi API cấp bằng cho nodeId
    setMessage(`Đã cấp bằng cho node ${nodeId} (giả lập).`);
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Cấp Bằng Cho Node Khác</h2>
      <input
        type="text"
        placeholder="Nhập Node ID"
        value={nodeId}
        onChange={e => setNodeId(e.target.value)}
      />
      <button onClick={handleGrant} disabled={!nodeId} style={{ marginLeft: 8 }}>
        Cấp Bằng
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
