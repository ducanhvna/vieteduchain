import { useState } from 'react';

export default function Grant() {
  const [nodeId, setNodeId] = useState('');
  const [metadata, setMetadata] = useState('');
  const [issuer, setIssuer] = useState('');
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');

  const handleGrant = async () => {
    if (!nodeId || !metadata || !issuer || !signature) return;
    try {
      const res = await fetch('/api/edu-cert/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: nodeId, metadata, issuer, signature })
      });
      const data = await res.json();
      setMessage(data.message || JSON.stringify(data));
    } catch (e) {
      setMessage('Lỗi khi gọi API cấp bằng');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Cấp Bằng Cho Node Khác</h2>
      <input type="text" placeholder="Hash (Node ID)" value={nodeId} onChange={e => setNodeId(e.target.value)} />
      <input type="text" placeholder="Metadata" value={metadata} onChange={e => setMetadata(e.target.value)} style={{ marginLeft: 8 }} />
      <input type="text" placeholder="Issuer" value={issuer} onChange={e => setIssuer(e.target.value)} style={{ marginLeft: 8 }} />
      <input type="text" placeholder="Signature" value={signature} onChange={e => setSignature(e.target.value)} style={{ marginLeft: 8 }} />
      <button onClick={handleGrant} disabled={!nodeId || !metadata || !issuer || !signature} style={{ marginLeft: 8 }}>
        Cấp Bằng
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
