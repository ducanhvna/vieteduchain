"use client";
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { Tabs, Input, Button, Table, message as antdMessage, Card, Space } from 'antd';

export default function Page() {
  const [tab, setTab] = useState<'seats'|'scores'|'mint'|'burn'|'push'|'matching'|'results'|'assign'>('seats');
  const [seatId, setSeatId] = useState('');
  const [candidateHash, setCandidateHash] = useState('');
  const [score, setScore] = useState('');
  const [assignSeatId, setAssignSeatId] = useState('');
  const [assignCandidate, setAssignCandidate] = useState('');
  const [seats, setSeats] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  // Fetch lists
  const fetchSeats = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/eduadmission/list_seats`);
      setSeats(await res.json());
    } catch { setMessage('Lỗi khi tải danh sách ghế'); }
  };
  const fetchScores = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/eduadmission/list_scores`);
      setScores(await res.json());
    } catch { setMessage('Lỗi khi tải điểm'); }
  };
  const fetchResults = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/eduadmission/list_results`);
      setResults(await res.json());
    } catch { setMessage('Lỗi khi tải kết quả'); }
  };

  // Actions
  const handleMintSeat = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/eduadmission/mint_seat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: seatId })
      });
      const data = await res.json();
      setMessage(data.success ? 'Mint seat thành công!' : data.detail || 'Lỗi mint seat');
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Mint seat thành công!' : data.detail || 'Lỗi mint seat');
      fetchSeats();
    } catch { setMessage('Lỗi khi mint seat'); antdMessage.error('Lỗi khi mint seat'); }
  };
  const handleBurnSeat = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/eduadmission/burn_seat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: seatId })
      });
      const data = await res.json();
      setMessage(data.success ? 'Burn seat thành công!' : data.detail || 'Lỗi burn seat');
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Burn seat thành công!' : data.detail || 'Lỗi burn seat');
      fetchSeats();
    } catch { setMessage('Lỗi khi burn seat'); antdMessage.error('Lỗi khi burn seat'); }
  };
  const handlePushScore = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/eduadmission/push_score`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_hash: candidateHash, score: parseInt(score) })
      });
      const data = await res.json();
      setMessage(data.success ? 'Push score thành công!' : data.detail || 'Lỗi push score');
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Push score thành công!' : data.detail || 'Lỗi push score');
      fetchScores();
    } catch { setMessage('Lỗi khi push score'); antdMessage.error('Lỗi khi push score'); }
  };
  const handleRunMatching = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/eduadmission/run_matching`, { method: 'POST' });
      const data = await res.json();
      setMessage(data.success ? 'Matching thành công!' : data.detail || 'Lỗi matching');
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Matching thành công!' : data.detail || 'Lỗi matching');
      fetchResults();
      fetchSeats();
    } catch { setMessage('Lỗi khi matching'); antdMessage.error('Lỗi khi matching'); }
  };
  const handleAssignSeat = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/eduadmission/assign_seat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_id: assignSeatId, candidate_hash: assignCandidate })
      });
      const data = await res.json();
      setMessage(data.success ? 'Xác nhận nhập học thành công!' : data.detail || 'Lỗi xác nhận');
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Xác nhận nhập học thành công!' : data.detail || 'Lỗi xác nhận');
      fetchSeats();
      fetchResults();
    } catch { setMessage('Lỗi khi xác nhận nhập học'); antdMessage.error('Lỗi khi xác nhận nhập học'); }
  };

  useEffect(() => {
    if (tab === 'seats') fetchSeats();
    if (tab === 'scores') fetchScores();
    if (tab === 'results') fetchResults();
  }, [tab]);

  return (
    <Card style={{ maxWidth: 1000, margin: '32px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Tuyển sinh minh bạch (EduAdmission)</h2>
      <Tabs
        activeKey={tab}
        onChange={key => setTab(key as typeof tab)}
        items={[
          {
            key: 'seats',
            label: 'Chỉ tiêu (Seat-NFT)',
            children: (
              <Table
                dataSource={seats}
                rowKey="id"
                columns={[
                  { title: 'Seat ID', dataIndex: 'id' },
                  { title: 'Owner', dataIndex: 'owner', render: (v: string) => v || '-' },
                  { title: 'Burned', dataIndex: 'burned', render: (v: boolean) => v ? 'Đã burn' : 'Còn' },
                ]}
                pagination={false}
                style={{ background: '#fff' }}
              />
            ),
          },
          {
            key: 'scores',
            label: 'Điểm thi',
            children: (
              <Table
                dataSource={scores}
                rowKey="score_id"
                columns={[
                  { title: 'Score ID', dataIndex: 'score_id' },
                  { title: 'Student ID', dataIndex: 'student_id' },
                  { title: 'Môn', dataIndex: 'subject' },
                  { title: 'Điểm', dataIndex: 'score' },
                  { title: 'Năm', dataIndex: 'year' },
                ]}
                pagination={false}
                style={{ background: '#fff' }}
              />
            ),
          },
          {
            key: 'mint',
            label: 'Mint Seat',
            children: (
              <Space direction="vertical">
                <Input placeholder="Seat ID" value={seatId} onChange={e=>setSeatId(e.target.value)} style={{width:180}} />
                <Button type="primary" onClick={handleMintSeat} disabled={!seatId}>Mint</Button>
              </Space>
            ),
          },
          {
            key: 'burn',
            label: 'Burn Seat',
            children: (
              <Space direction="vertical">
                <Input placeholder="Seat ID" value={seatId} onChange={e=>setSeatId(e.target.value)} style={{width:180}} />
                <Button danger onClick={handleBurnSeat} disabled={!seatId}>Burn</Button>
              </Space>
            ),
          },
          {
            key: 'push',
            label: 'Push Score',
            children: (
              <Space direction="vertical">
                <Input placeholder="Candidate Hash" value={candidateHash} onChange={e=>setCandidateHash(e.target.value)} style={{width:180}} />
                <Input type="number" placeholder="Score" value={score} onChange={e=>setScore(e.target.value)} style={{width:100}} />
                <Button type="primary" onClick={handlePushScore} disabled={!candidateHash||!score}>Push</Button>
              </Space>
            ),
          },
          {
            key: 'matching',
            label: 'Run Matching',
            children: (
              <Button type="primary" onClick={handleRunMatching}>Run Matching</Button>
            ),
          },
          {
            key: 'results',
            label: 'Kết quả',
            children: (
              <Table
                dataSource={results}
                rowKey="result_id"
                columns={[
                  { title: 'Result ID', dataIndex: 'result_id' },
                  { title: 'Student ID', dataIndex: 'student_id' },
                  { title: 'Trường', dataIndex: 'school' },
                  { title: 'Trạng thái', dataIndex: 'status' },
                  { title: 'Năm', dataIndex: 'year' },
                ]}
                pagination={false}
                style={{ background: '#fff' }}
              />
            ),
          },
          {
            key: 'assign',
            label: 'Xác nhận nhập học',
            children: (
              <Space direction="vertical">
                <Input placeholder="Seat ID" value={assignSeatId} onChange={e=>setAssignSeatId(e.target.value)} style={{width:180}} />
                <Input placeholder="Candidate Hash" value={assignCandidate} onChange={e=>setAssignCandidate(e.target.value)} style={{width:180}} />
                <Button type="primary" onClick={handleAssignSeat} disabled={!assignSeatId||!assignCandidate}>Xác nhận nhập học</Button>
              </Space>
            ),
          },
        ]}
      />
      {message && <p style={{marginTop:16}}>{message}</p>}
    </Card>
  );
}
