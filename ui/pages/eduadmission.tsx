import React, { useState } from 'react';

export default function EduAdmission() {
  const [tab, setTab] = useState<'seats'|'scores'|'mint'|'burn'|'push'|'matching'|'results'|'assign'>('seats');
  // Mint/burn seat
  const [seatId, setSeatId] = useState('');
  // Push score
  const [candidateHash, setCandidateHash] = useState('');
  const [score, setScore] = useState('');
  // Assign seat
  const [assignSeatId, setAssignSeatId] = useState('');
  const [assignCandidate, setAssignCandidate] = useState('');
  // State
  const [seats, setSeats] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  // Fetch lists
  const fetchSeats = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/eduadmission/list_seats');
      setSeats(await res.json());
    } catch { setMessage('Lỗi khi lấy danh sách chỉ tiêu'); }
  };
  const fetchScores = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/eduadmission/list_scores');
      setScores(await res.json());
    } catch { setMessage('Lỗi khi lấy danh sách điểm'); }
  };
  const fetchResults = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/eduadmission/list_results');
      setResults(await res.json());
    } catch { setMessage('Lỗi khi lấy kết quả'); }
  };

  // Actions
  const handleMintSeat = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/eduadmission/mint_seat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: seatId })
      });
      const data = await res.json();
      setMessage(data.success ? 'Mint seat thành công!' : data.detail || 'Lỗi mint seat');
      fetchSeats();
    } catch { setMessage('Lỗi khi mint seat'); }
  };
  const handleBurnSeat = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/eduadmission/burn_seat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: seatId })
      });
      const data = await res.json();
      setMessage(data.success ? 'Burn seat thành công!' : data.detail || 'Lỗi burn seat');
      fetchSeats();
    } catch { setMessage('Lỗi khi burn seat'); }
  };
  const handlePushScore = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/eduadmission/push_score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_hash: candidateHash, score: parseInt(score) })
      });
      const data = await res.json();
      setMessage(data.success ? 'Push score thành công!' : data.detail || 'Lỗi push score');
      fetchScores();
    } catch { setMessage('Lỗi khi push score'); }
  };
  const handleRunMatching = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/eduadmission/run_matching', { method: 'POST' });
      const data = await res.json();
      setMessage(data.success ? 'Matching thành công!' : data.detail || 'Lỗi matching');
      fetchResults();
      fetchSeats();
    } catch { setMessage('Lỗi khi matching'); }
  };
  const handleAssignSeat = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/eduadmission/assign_seat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: assignSeatId, candidate_hash: assignCandidate })
      });
      const data = await res.json();
      setMessage(data.success ? 'Xác nhận nhập học thành công!' : data.detail || 'Lỗi xác nhận');
      fetchSeats();
      fetchResults();
    } catch { setMessage('Lỗi khi xác nhận nhập học'); }
  };

  // Auto fetch on tab change
  React.useEffect(() => {
    if (tab === 'seats') fetchSeats();
    if (tab === 'scores') fetchScores();
    if (tab === 'results') fetchResults();
  }, [tab]);

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <h2>Tuyển sinh minh bạch (EduAdmission)</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setTab('seats')} style={{ marginRight: 8, background: tab==='seats'?'#eee':'' }}>Chỉ tiêu (Seat-NFT)</button>
        <button onClick={() => setTab('scores')} style={{ marginRight: 8, background: tab==='scores'?'#eee':'' }}>Điểm thi</button>
        <button onClick={() => setTab('mint')} style={{ marginRight: 8, background: tab==='mint'?'#eee':'' }}>Mint Seat</button>
        <button onClick={() => setTab('burn')} style={{ marginRight: 8, background: tab==='burn'?'#eee':'' }}>Burn Seat</button>
        <button onClick={() => setTab('push')} style={{ marginRight: 8, background: tab==='push'?'#eee':'' }}>Push Score</button>
        <button onClick={() => setTab('matching')} style={{ marginRight: 8, background: tab==='matching'?'#eee':'' }}>Run Matching</button>
        <button onClick={() => setTab('results')} style={{ marginRight: 8, background: tab==='results'?'#eee':'' }}>Kết quả</button>
        <button onClick={() => setTab('assign')} style={{ background: tab==='assign'?'#eee':'' }}>Xác nhận nhập học</button>
      </div>
      {tab==='seats' && (
        <div>
          <h3>Danh sách chỉ tiêu (Seat-NFT)</h3>
          <table border={1} cellPadding={6} style={{ background: '#fff', borderCollapse: 'collapse' }}>
            <thead><tr><th>Seat ID</th><th>Owner</th><th>Burned</th></tr></thead>
            <tbody>
              {seats.map(s => (
                <tr key={s.id}><td>{s.id}</td><td>{s.owner||'-'}</td><td>{s.burned ? 'Đã burn' : 'Còn'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab==='scores' && (
        <div>
          <h3>Danh sách điểm thi</h3>
          <table border={1} cellPadding={6} style={{ background: '#fff', borderCollapse: 'collapse' }}>
            <thead><tr><th>Candidate Hash</th><th>Score</th></tr></thead>
            <tbody>
              {scores.map(s => (<tr key={s.candidate_hash}><td>{s.candidate_hash}</td><td>{s.score}</td></tr>))}
            </tbody>
          </table>
        </div>
      )}
      {tab==='mint' && (
        <div>
          <h3>Mint chỉ tiêu (Seat-NFT)</h3>
          <input type="text" placeholder="Seat ID" value={seatId} onChange={e=>setSeatId(e.target.value)} style={{width:180,marginRight:8}} />
          <button onClick={handleMintSeat} disabled={!seatId}>Mint</button>
        </div>
      )}
      {tab==='burn' && (
        <div>
          <h3>Burn chỉ tiêu (Seat-NFT)</h3>
          <input type="text" placeholder="Seat ID" value={seatId} onChange={e=>setSeatId(e.target.value)} style={{width:180,marginRight:8}} />
          <button onClick={handleBurnSeat} disabled={!seatId}>Burn</button>
        </div>
      )}
      {tab==='push' && (
        <div>
          <h3>Push điểm thi</h3>
          <input type="text" placeholder="Candidate Hash" value={candidateHash} onChange={e=>setCandidateHash(e.target.value)} style={{width:180,marginRight:8}} />
          <input type="number" placeholder="Score" value={score} onChange={e=>setScore(e.target.value)} style={{width:100,marginRight:8}} />
          <button onClick={handlePushScore} disabled={!candidateHash||!score}>Push</button>
        </div>
      )}
      {tab==='matching' && (
        <div>
          <h3>Chạy thuật toán phân bổ chỉ tiêu (Matching Engine)</h3>
          <button onClick={handleRunMatching}>Run Matching</button>
        </div>
      )}
      {tab==='results' && (
        <div>
          <h3>Kết quả tuyển sinh</h3>
          <table border={1} cellPadding={6} style={{ background: '#fff', borderCollapse: 'collapse' }}>
            <thead><tr><th>Candidate Hash</th><th>Seat ID</th><th>Admitted</th><th>Score</th></tr></thead>
            <tbody>
              {results.map(r => (<tr key={r.candidate_hash}><td>{r.candidate_hash}</td><td>{r.seat_id||'-'}</td><td>{r.admitted ? '✔' : ''}</td><td>{r.score}</td></tr>))}
            </tbody>
          </table>
        </div>
      )}
      {tab==='assign' && (
        <div>
          <h3>Xác nhận nhập học (gán seat cho thí sinh & burn seat)</h3>
          <input type="text" placeholder="Seat ID" value={assignSeatId} onChange={e=>setAssignSeatId(e.target.value)} style={{width:180,marginRight:8}} />
          <input type="text" placeholder="Candidate Hash" value={assignCandidate} onChange={e=>setAssignCandidate(e.target.value)} style={{width:180,marginRight:8}} />
          <button onClick={handleAssignSeat} disabled={!assignSeatId||!assignCandidate}>Xác nhận nhập học</button>
        </div>
      )}
      {message && <p style={{marginTop:16}}>{message}</p>}
    </div>
  );
}
