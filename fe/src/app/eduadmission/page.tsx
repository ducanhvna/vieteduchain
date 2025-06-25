"use client";
import React, { useState, useEffect } from 'react';
import { API_BASE_URL, NODEINFO_URL } from '@/config';
import { Tabs, Input, Button, Table, message as antdMessage, Card, Space, Select } from 'antd';

export default function Page() {
  const [tab, setTab] = useState<'seats'|'scores'|'mint'|'burn'|'push'|'matching'|'results'|'assign'|'quota'>('seats');
  const [seatId, setSeatId] = useState('');
  const [candidateHash, setCandidateHash] = useState('');
  const [score, setScore] = useState('');
  const [assignSeatId, setAssignSeatId] = useState('');
  const [assignCandidate, setAssignCandidate] = useState('');
  const [seats, setSeats] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [quotaSchoolDid, setQuotaSchoolDid] = useState('');
  const [quotaSeats, setQuotaSeats] = useState('');
  const [quotas, setQuotas] = useState<any[]>([]);
  const [schoolOptions, setSchoolOptions] = useState<{label: string, value: string}[]>([]);
  const [quotaController, setQuotaController] = useState('');
  const [quotaPubKey, setQuotaPubKey] = useState('');
  const [accountOptions, setAccountOptions] = useState<any[]>([]);

  // Fetch lists
  const fetchSeats = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/seats`);
      setSeats(await res.json());
    } catch { setMessage('Lỗi khi tải danh sách ghế'); }
  };
  const fetchScores = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/scores`);
      setScores(await res.json());
    } catch { setMessage('Lỗi khi tải điểm'); }
  };
  const fetchResults = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/results`);
      setResults(await res.json());
    } catch { setMessage('Lỗi khi tải kết quả'); }
  };
  const fetchQuotas = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/quotas`);
      setQuotas(await res.json());
    } catch { setMessage('Lỗi khi tải chỉ tiêu tuyển sinh'); }
  };

  // Fetch university DIDs for select options
  const fetchSchoolOptions = async () => {
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/?page=1&limit=1000&entity_type=Organization&entity_subtype=University`);
      const data = await res.json();
      setSchoolOptions(
        (data.items || []).map((item: any) => ({
          label: item.id, // dùng id làm label
          value: item.id  // dùng id làm value
        }))
      );
    } catch {}
  };

  // Fetch real user accounts for controller selection
  const fetchAccountOptions = async () => {
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/real-users`);
      if (res.ok) {
        const data = await res.json();
        const users = (data.real_users || []).filter((acc: any) => acc.pub_key);
        setAccountOptions(users);
      }
    } catch {}
  };

  // Actions
  const handleMintSeat = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/mint-seat`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_req: {
            from: "issuer_address",
            chain_id: "educhain-1"
          },
          seat_id: seatId 
        })
      });
      const data = await res.json();
      if (data.height && data.txhash) {
        setMessage('Mint seat thành công!');
        antdMessage.success('Mint seat thành công!');
        fetchSeats();
      } else {
        setMessage(data.detail || 'Lỗi mint seat');
        antdMessage.error(data.detail || 'Lỗi mint seat');
      }
    } catch { setMessage('Lỗi khi mint seat'); antdMessage.error('Lỗi khi mint seat'); }
  };
  
  const handleBurnSeat = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/burn-seat`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_req: {
            from: "issuer_address",
            chain_id: "educhain-1"
          },
          seat_id: seatId 
        })
      });
      const data = await res.json();
      if (data.height && data.txhash) {
        setMessage('Burn seat thành công!');
        antdMessage.success('Burn seat thành công!');
        fetchSeats();
      } else {
        setMessage(data.detail || 'Lỗi burn seat');
        antdMessage.error(data.detail || 'Lỗi burn seat');
      }
    } catch { setMessage('Lỗi khi burn seat'); antdMessage.error('Lỗi khi burn seat'); }
  };
  
  const handlePushScore = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/push-score`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_req: {
            from: "issuer_address",
            chain_id: "educhain-1"
          },
          candidate_hash: candidateHash, 
          score: parseInt(score) 
        })
      });
      const data = await res.json();
      if (data.height && data.txhash) {
        setMessage('Push score thành công!');
        antdMessage.success('Push score thành công!');
        fetchScores();
      } else {
        setMessage(data.detail || 'Lỗi push score');
        antdMessage.error(data.detail || 'Lỗi push score');
      }
    } catch { setMessage('Lỗi khi push score'); antdMessage.error('Lỗi khi push score'); }
  };
  
  const handleRunMatching = async () => {
    setMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/run-matching`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_req: {
            from: "issuer_address",
            chain_id: "educhain-1"
          }
        })
      });
      const data = await res.json();
      if (data.height && data.txhash) {
        setMessage('Matching thành công!');
        antdMessage.success('Matching thành công!');
        fetchResults();
        fetchSeats();
      } else {
        setMessage(data.detail || 'Lỗi matching');
        antdMessage.error(data.detail || 'Lỗi matching');
      }
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
  const handleCreateQuota = async () => {
    setMessage('');
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'eduid',
          controller: quotaController,
          entity_type: 'Admission',
          entity_subtype: 'quota',
          public_key: quotaPubKey,
          school_did: quotaSchoolDid,
          seats: parseInt(quotaSeats)
        })
      });
      const data = await res.json();
      if (data.did) {
        setMessage('Tạo chỉ tiêu thành công!');
        antdMessage.success('Tạo chỉ tiêu thành công!');
        setQuotaSchoolDid('');
        setQuotaSeats('');
        setQuotaController('');
        setQuotaPubKey('');
        fetchQuotas();
      } else {
        setMessage(data.detail || 'Lỗi tạo chỉ tiêu');
        antdMessage.error(data.detail || 'Lỗi tạo chỉ tiêu');
      }
    } catch { setMessage('Lỗi khi tạo chỉ tiêu'); antdMessage.error('Lỗi khi tạo chỉ tiêu'); }
  };

  useEffect(() => {
    if (tab === 'quota') {
      fetchQuotas();
      fetchSchoolOptions();
      fetchAccountOptions();
    }
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
            key: 'quota',
            label: 'Chỉ tiêu tuyển sinh',
            children: (
              <>
                <Table
                  dataSource={quotas}
                  rowKey="school_did"
                  columns={[
                    { title: 'Trường (DID)', dataIndex: 'school_did' },
                    { title: 'Chỉ tiêu', dataIndex: 'seats' },
                  ]}
                  pagination={false}
                  style={{ background: '#fff', marginBottom: 24 }}
                />
                <Space direction="vertical">
                  <Select
                    showSearch
                    placeholder="Chọn trường đại học (DID)"
                    value={quotaSchoolDid}
                    onChange={setQuotaSchoolDid}
                    options={schoolOptions}
                    style={{ width: 300 }}
                    filterOption={(input, option) => (option?.label ?? option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
                    optionLabelProp="label"
                  />
                  <Select
                    showSearch
                    placeholder="Chọn người kiểm soát (controller) từ danh sách account trên node"
                    value={quotaController}
                    onChange={value => {
                      setQuotaController(value);
                      // Auto-fill public key
                      const acc = accountOptions.find((acc: any) => acc.address === value);
                      if (acc && acc.pub_key && acc.pub_key.key) {
                        setQuotaPubKey(acc.pub_key.key);
                      } else {
                        setQuotaPubKey('');
                      }
                    }}
                    style={{ width: 300 }}
                    filterOption={(input, option) => {
                      const label = option?.children?.toString() || '';
                      return label.toLowerCase().includes(input.toLowerCase());
                    }}
                    optionLabelProp="children"
                  >
                    {accountOptions.map((acc: any) => (
                      <Select.Option key={acc.address} value={acc.address}>
                        {acc.address}
                      </Select.Option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Khóa công khai (public key)"
                    value={quotaPubKey}
                    readOnly
                    style={{ width: 300 }}
                  />
                  <Input type="number" placeholder="Chỉ tiêu tuyển sinh" value={quotaSeats} onChange={e => setQuotaSeats(e.target.value)} style={{ width: 180 }} />
                  <Button type="primary" onClick={handleCreateQuota} disabled={!quotaSchoolDid || !quotaSeats || !quotaController || !quotaPubKey}>Tạo chỉ tiêu tuyển sinh</Button>
                </Space>
              </>
            ),
          },
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
