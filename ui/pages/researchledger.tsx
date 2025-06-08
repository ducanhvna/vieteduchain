import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function ResearchLedger() {
  const [tab, setTab] = useState<'register'|'mint'|'plagiarism'|'reward'|'query'|'list'|'search'>('register');
  // Register hash
  const [hash, setHash] = useState('');
  const [cid, setCid] = useState('');
  const [doi, setDoi] = useState('');
  const [authors, setAuthors] = useState('');
  const [owner, setOwner] = useState('');
  // Mint NFT
  const [mintHash, setMintHash] = useState('');
  const [mintDoi, setMintDoi] = useState('');
  const [mintOwner, setMintOwner] = useState('');
  // Plagiarism
  const [origHash, setOrigHash] = useState('');
  const [plagHash, setPlagHash] = useState('');
  const [claimer, setClaimer] = useState('');
  // Reward
  const [rewardClaimId, setRewardClaimId] = useState('');
  // Query
  const [queryHash, setQueryHash] = useState('');
  const [queryClaimId, setQueryClaimId] = useState('');
  // Search
  const [searchOwner, setSearchOwner] = useState('');
  const [searchDoi, setSearchDoi] = useState('');

  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState('');

  // Handlers
  const handleRegister = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/register_hash`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, cid, doi, authors: authors.split(',').map(s=>s.trim()).filter(Boolean), owner })
      });
      const data = await res.json();
      setMessage(data.success ? 'Đăng ký hash thành công!' : data.detail || 'Lỗi đăng ký hash');
      setResult(data.record);
    } catch { setMessage('Lỗi khi đăng ký hash'); }
  };
  const handleMint = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/mint_doi_nft`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: mintHash, doi: mintDoi, owner: mintOwner })
      });
      const data = await res.json();
      setMessage(data.success ? 'Mint NFT thành công!' : data.detail || 'Lỗi mint NFT');
      setResult(data.record);
    } catch { setMessage('Lỗi khi mint NFT'); }
  };
  const handlePlagiarism = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/submit_plagiarism`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_hash: origHash, plagiarized_hash: plagHash, claimer })
      });
      const data = await res.json();
      setMessage(data.success ? 'Nộp claim đạo văn thành công!' : data.detail || 'Lỗi claim');
      setResult(data.claim);
    } catch { setMessage('Lỗi khi nộp claim'); }
  };
  const handleReward = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/reward_bounty`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: rewardClaimId })
      });
      const data = await res.json();
      setMessage(data.success ? 'Thưởng bounty thành công!' : data.detail || 'Lỗi thưởng');
      setResult(data.claim);
    } catch { setMessage('Lỗi khi thưởng bounty'); }
  };
  const handleQueryHash = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/get_hash_record?hash=${encodeURIComponent(queryHash)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setMessage('Tìm thấy hash!');
      } else setMessage('Không tìm thấy hash!');
    } catch { setMessage('Lỗi khi truy vấn hash'); }
  };
  const handleQueryClaim = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/get_bounty_claim?claim_id=${encodeURIComponent(queryClaimId)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setMessage('Tìm thấy claim!');
      } else setMessage('Không tìm thấy claim!');
    } catch { setMessage('Lỗi khi truy vấn claim'); }
  };
  const handleList = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/list_hashes`);
      const data = await res.json();
      setResult(data);
    } catch { setMessage('Lỗi khi liệt kê hash'); }
  };
  const handleListClaims = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/list_bounty_claims`);
      const data = await res.json();
      setResult(data);
    } catch { setMessage('Lỗi khi liệt kê claim'); }
  };
  const handleSearch = async () => {
    setMessage(''); setResult(null);
    try {
      const params = [];
      if (searchOwner) params.push(`owner=${encodeURIComponent(searchOwner)}`);
      if (searchDoi) params.push(`doi=${encodeURIComponent(searchDoi)}`);
      const res = await fetch(`${API_BASE_URL}/api/research/search_hashes?${params.join('&')}`);
      const data = await res.json();
      setResult(data);
    } catch { setMessage('Lỗi khi tìm kiếm'); }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>ResearchLedger – Chống đạo văn & xác thực nghiên cứu</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setTab('register')} style={{ marginRight: 8, background: tab==='register'?'#eee':'' }}>Đăng ký hash</button>
        <button onClick={() => setTab('mint')} style={{ marginRight: 8, background: tab==='mint'?'#eee':'' }}>Mint DOI-NFT</button>
        <button onClick={() => setTab('plagiarism')} style={{ marginRight: 8, background: tab==='plagiarism'?'#eee':'' }}>Nộp claim đạo văn</button>
        <button onClick={() => setTab('reward')} style={{ marginRight: 8, background: tab==='reward'?'#eee':'' }}>Thưởng bounty</button>
        <button onClick={() => setTab('query')} style={{ marginRight: 8, background: tab==='query'?'#eee':'' }}>Tra cứu</button>
        <button onClick={() => setTab('list')} style={{ marginRight: 8, background: tab==='list'?'#eee':'' }}>Liệt kê</button>
        <button onClick={() => setTab('search')} style={{ background: tab==='search'?'#eee':'' }}>Tìm kiếm</button>
      </div>
      {tab==='register' && (
        <div>
          <input type="text" placeholder="Hash SHA-256" value={hash} onChange={e=>setHash(e.target.value)} style={{width:220,marginRight:8}} />
          <input type="text" placeholder="CID (IPFS)" value={cid} onChange={e=>setCid(e.target.value)} style={{width:120,marginRight:8}} />
          <input type="text" placeholder="DOI" value={doi} onChange={e=>setDoi(e.target.value)} style={{width:120,marginRight:8}} />
          <input type="text" placeholder="Tác giả (phân tách ,)" value={authors} onChange={e=>setAuthors(e.target.value)} style={{width:180,marginRight:8}} />
          <input type="text" placeholder="Owner" value={owner} onChange={e=>setOwner(e.target.value)} style={{width:120,marginRight:8}} />
          <button onClick={handleRegister} disabled={!hash||!owner}>Đăng ký</button>
        </div>
      )}
      {tab==='mint' && (
        <div>
          <input type="text" placeholder="Hash SHA-256" value={mintHash} onChange={e=>setMintHash(e.target.value)} style={{width:220,marginRight:8}} />
          <input type="text" placeholder="DOI" value={mintDoi} onChange={e=>setMintDoi(e.target.value)} style={{width:120,marginRight:8}} />
          <input type="text" placeholder="Owner" value={mintOwner} onChange={e=>setMintOwner(e.target.value)} style={{width:120,marginRight:8}} />
          <button onClick={handleMint} disabled={!mintHash||!mintDoi||!mintOwner}>Mint NFT</button>
        </div>
      )}
      {tab==='plagiarism' && (
        <div>
          <input type="text" placeholder="Hash gốc" value={origHash} onChange={e=>setOrigHash(e.target.value)} style={{width:220,marginRight:8}} />
          <input type="text" placeholder="Hash đạo văn" value={plagHash} onChange={e=>setPlagHash(e.target.value)} style={{width:220,marginRight:8}} />
          <input type="text" placeholder="Claimer" value={claimer} onChange={e=>setClaimer(e.target.value)} style={{width:120,marginRight:8}} />
          <button onClick={handlePlagiarism} disabled={!origHash||!plagHash||!claimer}>Nộp claim</button>
        </div>
      )}
      {tab==='reward' && (
        <div>
          <input type="text" placeholder="Claim ID" value={rewardClaimId} onChange={e=>setRewardClaimId(e.target.value)} style={{width:220,marginRight:8}} />
          <button onClick={handleReward} disabled={!rewardClaimId}>Thưởng bounty</button>
        </div>
      )}
      {tab==='query' && (
        <div>
          <input type="text" placeholder="Hash" value={queryHash} onChange={e=>setQueryHash(e.target.value)} style={{width:180,marginRight:8}} />
          <button onClick={handleQueryHash} disabled={!queryHash}>Tra cứu hash</button>
          <input type="text" placeholder="Claim ID" value={queryClaimId} onChange={e=>setQueryClaimId(e.target.value)} style={{width:180,marginLeft:16,marginRight:8}} />
          <button onClick={handleQueryClaim} disabled={!queryClaimId}>Tra cứu claim</button>
        </div>
      )}
      {tab==='list' && (
        <div>
          <button onClick={handleList}>Liệt kê tất cả hash</button>
          <button onClick={handleListClaims} style={{marginLeft:8}}>Liệt kê tất cả claim</button>
        </div>
      )}
      {tab==='search' && (
        <div>
          <input type="text" placeholder="Owner" value={searchOwner} onChange={e=>setSearchOwner(e.target.value)} style={{width:120,marginRight:8}} />
          <input type="text" placeholder="DOI" value={searchDoi} onChange={e=>setSearchDoi(e.target.value)} style={{width:120,marginRight:8}} />
          <button onClick={handleSearch} disabled={!searchOwner&&!searchDoi}>Tìm kiếm</button>
        </div>
      )}
      {message && <p>{message}</p>}
      {result && (
        <div style={{marginTop:16}}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
