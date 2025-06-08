import { useState } from 'react';

export default function EduPay() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<number|null>(null);
  const [mintAmount, setMintAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [escrowId, setEscrowId] = useState('');
  const [escrowAmount, setEscrowAmount] = useState('');
  const [escrowSchool, setEscrowSchool] = useState('');
  const [escrowInfo, setEscrowInfo] = useState<any>(null);
  const [releaseEscrowId, setReleaseEscrowId] = useState('');
  const [proof, setProof] = useState(false);
  const [price, setPrice] = useState<number|null>(null);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'balance'|'mint'|'transfer'|'escrow'|'release'|'price'>('balance');

  const handleGetBalance = async () => {
    setMessage('');
    setBalance(null);
    try {
      const res = await fetch(`/api/edupay/balance?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      setBalance(data.balance);
    } catch {
      setMessage('Lỗi khi truy vấn số dư');
    }
  };

  const handleMint = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/edupay/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount: parseFloat(mintAmount) })
      });
      const data = await res.json();
      setMessage(data.success ? 'Mint thành công!' : data.detail || 'Lỗi mint');
      setBalance(data.balance);
    } catch {
      setMessage('Lỗi khi mint eVND');
    }
  };

  const handleTransfer = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/edupay/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_address: address, to_address: transferTo, amount: parseFloat(transferAmount) })
      });
      const data = await res.json();
      setMessage(data.success ? 'Chuyển tiền thành công!' : data.detail || 'Lỗi chuyển tiền');
    } catch {
      setMessage('Lỗi khi chuyển eVND');
    }
  };

  const handleCreateEscrow = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/edupay/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrow_id: escrowId, payer: address, school: escrowSchool, amount: parseFloat(escrowAmount) })
      });
      const data = await res.json();
      setMessage(data.success ? 'Tạo escrow thành công!' : data.detail || 'Lỗi tạo escrow');
      setEscrowInfo(data.escrow);
    } catch {
      setMessage('Lỗi khi tạo escrow');
    }
  };

  const handleReleaseEscrow = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/edupay/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrow_id: releaseEscrowId, proof_of_enrollment: proof })
      });
      const data = await res.json();
      setMessage(data.success ? 'Release escrow thành công!' : data.detail || 'Lỗi release escrow');
      setEscrowInfo(data.escrow);
    } catch {
      setMessage('Lỗi khi release escrow');
    }
  };

  const handleGetEscrow = async () => {
    setMessage('');
    try {
      const res = await fetch(`/api/edupay/escrow?escrow_id=${encodeURIComponent(escrowId)}`);
      const data = await res.json();
      setEscrowInfo(data);
    } catch {
      setMessage('Lỗi khi truy vấn escrow');
    }
  };

  const handleGetPrice = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/edupay/price');
      const data = await res.json();
      setPrice(data.vnd_usdc);
    } catch {
      setMessage('Lỗi khi lấy giá oracle');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Thanh toán học phí & học bổng (EduPay)</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setTab('balance')} style={{ marginRight: 8, background: tab==='balance'?'#eee':'' }}>Số dư</button>
        <button onClick={() => setTab('mint')} style={{ marginRight: 8, background: tab==='mint'?'#eee':'' }}>Mint eVND</button>
        <button onClick={() => setTab('transfer')} style={{ marginRight: 8, background: tab==='transfer'?'#eee':'' }}>Chuyển eVND</button>
        <button onClick={() => setTab('escrow')} style={{ marginRight: 8, background: tab==='escrow'?'#eee':'' }}>Tạo Escrow</button>
        <button onClick={() => setTab('release')} style={{ marginRight: 8, background: tab==='release'?'#eee':'' }}>Release Escrow</button>
        <button onClick={() => setTab('price')} style={{ background: tab==='price'?'#eee':'' }}>Giá Oracle</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input type="text" placeholder="Địa chỉ (ví)" value={address} onChange={e => setAddress(e.target.value)} style={{ width: 300 }} />
      </div>
      {tab==='balance' && (
        <div>
          <button onClick={handleGetBalance} disabled={!address}>Xem số dư</button>
          {balance!==null && <p>Số dư eVND: <b>{balance}</b></p>}
        </div>
      )}
      {tab==='mint' && (
        <div>
          <input type="number" placeholder="Số lượng eVND" value={mintAmount} onChange={e => setMintAmount(e.target.value)} style={{ width: 200, marginRight: 8 }} />
          <button onClick={handleMint} disabled={!address || !mintAmount}>Mint eVND</button>
        </div>
      )}
      {tab==='transfer' && (
        <div>
          <input type="text" placeholder="Địa chỉ nhận" value={transferTo} onChange={e => setTransferTo(e.target.value)} style={{ width: 200, marginRight: 8 }} />
          <input type="number" placeholder="Số lượng" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} style={{ width: 120, marginRight: 8 }} />
          <button onClick={handleTransfer} disabled={!address || !transferTo || !transferAmount}>Chuyển</button>
        </div>
      )}
      {tab==='escrow' && (
        <div>
          <input type="text" placeholder="Escrow ID" value={escrowId} onChange={e => setEscrowId(e.target.value)} style={{ width: 120, marginRight: 8 }} />
          <input type="text" placeholder="Địa chỉ trường" value={escrowSchool} onChange={e => setEscrowSchool(e.target.value)} style={{ width: 180, marginRight: 8 }} />
          <input type="number" placeholder="Số tiền" value={escrowAmount} onChange={e => setEscrowAmount(e.target.value)} style={{ width: 120, marginRight: 8 }} />
          <button onClick={handleCreateEscrow} disabled={!address || !escrowId || !escrowSchool || !escrowAmount}>Tạo Escrow</button>
          <button onClick={handleGetEscrow} disabled={!escrowId} style={{ marginLeft: 8 }}>Xem Escrow</button>
        </div>
      )}
      {tab==='release' && (
        <div>
          <input type="text" placeholder="Escrow ID" value={releaseEscrowId} onChange={e => setReleaseEscrowId(e.target.value)} style={{ width: 120, marginRight: 8 }} />
          <label style={{ marginRight: 8 }}>
            <input type="checkbox" checked={proof} onChange={e => setProof(e.target.checked)} /> Proof of Enrollment
          </label>
          <button onClick={handleReleaseEscrow} disabled={!releaseEscrowId}>Release Escrow</button>
        </div>
      )}
      {tab==='price' && (
        <div>
          <button onClick={handleGetPrice}>Lấy giá VND/USDC</button>
          {price && <p>1 USDC ≈ <b>{price}</b> VND</p>}
        </div>
      )}
      {message && <p>{message}</p>}
      {escrowInfo && (
        <div style={{ marginTop: 16 }}>
          <pre>{JSON.stringify(escrowInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
