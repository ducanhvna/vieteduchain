import { useState } from 'react';

export default function Vote() {
  const [nodeId, setNodeId] = useState('');
  const [approve, setApprove] = useState(true);
  const [message, setMessage] = useState('');

  const handleVote = async () => {
    if (!nodeId) return;
    // TODO: Gọi API biểu quyết cho nodeId
    setMessage(`Đã biểu quyết ${approve ? 'duyệt' : 'từ chối'} cho node ${nodeId} (giả lập).`);
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Biểu Quyết Cấp Bằng Cho Node</h2>
      <input
        type="text"
        placeholder="Nhập Node ID"
        value={nodeId}
        onChange={e => setNodeId(e.target.value)}
      />
      <label style={{ marginLeft: 8 }}>
        <input
          type="radio"
          checked={approve}
          onChange={() => setApprove(true)}
        /> Duyệt
      </label>
      <label style={{ marginLeft: 8 }}>
        <input
          type="radio"
          checked={!approve}
          onChange={() => setApprove(false)}
        /> Từ chối
      </label>
      <button onClick={handleVote} disabled={!nodeId} style={{ marginLeft: 8 }}>
        Biểu Quyết
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
