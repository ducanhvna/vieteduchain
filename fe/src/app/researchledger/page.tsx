"use client";
import { useState } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, Tabs, Input, Button, Space, Typography, message as antdMessage } from 'antd';
import type { ChangeEvent } from 'react';

export default function Page() {
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
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Đăng ký hash thành công!' : data.detail || 'Lỗi đăng ký hash');
    } catch { setMessage('Lỗi khi đăng ký hash'); antdMessage.error('Lỗi khi đăng ký hash'); }
  };
  const handleMint = async () => {
    setMessage(''); setResult(null);
    try {
      // Generate a unique token ID if not provided
      const token_id = `doi-${Date.now()}`;
      
      const res = await fetch(`${API_BASE_URL}/api/research/mint_doi_nft`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token_id: token_id,
          hash: mintHash, 
          doi: mintDoi, 
          owner: mintOwner 
        })
      });
      const data = await res.json();
      setMessage(data.success ? 'Mint NFT thành công!' : data.detail || 'Lỗi mint NFT');
      setResult(data);
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Mint NFT thành công!' : data.detail || 'Lỗi mint NFT');
    } catch (error) { 
      console.error("Error minting NFT:", error);
      setMessage('Lỗi khi mint NFT'); 
      antdMessage.error('Lỗi khi mint NFT'); 
    }
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
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Nộp claim đạo văn thành công!' : data.detail || 'Lỗi claim');
    } catch { setMessage('Lỗi khi nộp claim'); antdMessage.error('Lỗi khi nộp claim'); }
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
      antdMessage[data.success ? 'success' : 'error'](data.success ? 'Thưởng bounty thành công!' : data.detail || 'Lỗi thưởng');
    } catch { setMessage('Lỗi khi thưởng bounty'); antdMessage.error('Lỗi khi thưởng bounty'); }
  };
  const handleQueryHash = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/get_hash_record?hash=${encodeURIComponent(queryHash)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setMessage('Tìm thấy hash!');
        antdMessage.success('Tìm thấy hash!');
      } else { setMessage('Không tìm thấy hash!'); antdMessage.error('Không tìm thấy hash!'); }
    } catch { setMessage('Lỗi khi truy vấn hash'); antdMessage.error('Lỗi khi truy vấn hash'); }
  };
  const handleQueryClaim = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/get_bounty_claim?claim_id=${encodeURIComponent(queryClaimId)}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setMessage('Tìm thấy claim!');
        antdMessage.success('Tìm thấy claim!');
      } else { setMessage('Không tìm thấy claim!'); antdMessage.error('Không tìm thấy claim!'); }
    } catch { setMessage('Lỗi khi truy vấn claim'); antdMessage.error('Lỗi khi truy vấn claim'); }
  };
  const handleList = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/list_hashes`);
      const data = await res.json();
      setResult(data);
    } catch { setMessage('Lỗi khi liệt kê hash'); antdMessage.error('Lỗi khi liệt kê hash'); }
  };
  const handleListClaims = async () => {
    setMessage(''); setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/research/list_bounty_claims`);
      const data = await res.json();
      setResult(data);
    } catch { setMessage('Lỗi khi liệt kê claim'); antdMessage.error('Lỗi khi liệt kê claim'); }
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
    } catch { setMessage('Lỗi khi tìm kiếm'); antdMessage.error('Lỗi khi tìm kiếm'); }
  };

  return (
    <Card style={{ padding: 32, maxWidth: 900, margin: '32px auto' }}>
      <Typography.Title level={3}>ResearchLedger – Chống đạo văn & xác thực nghiên cứu</Typography.Title>
      <Tabs
        activeKey={tab}
        onChange={key => setTab(key as typeof tab)}
        items={[
          {
            key: 'register',
            label: 'Đăng ký hash',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="Hash SHA-256" value={hash} onChange={e=>setHash(e.target.value)} style={{width:220}} />
                <Input placeholder="CID (IPFS)" value={cid} onChange={e=>setCid(e.target.value)} style={{width:120}} />
                <Input placeholder="DOI" value={doi} onChange={e=>setDoi(e.target.value)} style={{width:120}} />
                <Input placeholder="Tác giả (phân tách ,)" value={authors} onChange={e=>setAuthors(e.target.value)} style={{width:180}} />
                <Input placeholder="Owner" value={owner} onChange={e=>setOwner(e.target.value)} style={{width:120}} />
                <Button type="primary" onClick={handleRegister} disabled={!hash||!owner}>Đăng ký</Button>
              </Space>
            ),
          },
          {
            key: 'mint',
            label: 'Mint DOI-NFT',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="Hash SHA-256" value={mintHash} onChange={e=>setMintHash(e.target.value)} style={{width:220}} />
                <Input placeholder="DOI" value={mintDoi} onChange={e=>setMintDoi(e.target.value)} style={{width:120}} />
                <Input placeholder="Owner" value={mintOwner} onChange={e=>setMintOwner(e.target.value)} style={{width:120}} />
                <Button type="primary" onClick={handleMint} disabled={!mintHash||!mintDoi||!mintOwner}>Mint NFT</Button>
              </Space>
            ),
          },
          {
            key: 'plagiarism',
            label: 'Nộp claim đạo văn',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="Hash gốc" value={origHash} onChange={e=>setOrigHash(e.target.value)} style={{width:220}} />
                <Input placeholder="Hash đạo văn" value={plagHash} onChange={e=>setPlagHash(e.target.value)} style={{width:220}} />
                <Input placeholder="Claimer" value={claimer} onChange={e=>setClaimer(e.target.value)} style={{width:120}} />
                <Button type="primary" onClick={handlePlagiarism} disabled={!origHash||!plagHash||!claimer}>Nộp claim</Button>
              </Space>
            ),
          },
          {
            key: 'reward',
            label: 'Thưởng bounty',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="Claim ID" value={rewardClaimId} onChange={e=>setRewardClaimId(e.target.value)} style={{width:220}} />
                <Button type="primary" onClick={handleReward} disabled={!rewardClaimId}>Thưởng bounty</Button>
              </Space>
            ),
          },
          {
            key: 'query',
            label: 'Tra cứu',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="Hash" value={queryHash} onChange={e=>setQueryHash(e.target.value)} style={{width:180}} />
                <Button onClick={handleQueryHash} disabled={!queryHash}>Tra cứu hash</Button>
                <Input placeholder="Claim ID" value={queryClaimId} onChange={e=>setQueryClaimId(e.target.value)} style={{width:180}} />
                <Button onClick={handleQueryClaim} disabled={!queryClaimId}>Tra cứu claim</Button>
              </Space>
            ),
          },
          {
            key: 'list',
            label: 'Liệt kê',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button onClick={handleList}>Liệt kê tất cả hash</Button>
                <Button onClick={handleListClaims}>Liệt kê tất cả claim</Button>
              </Space>
            ),
          },
          {
            key: 'search',
            label: 'Tìm kiếm',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input placeholder="Owner" value={searchOwner} onChange={e=>setSearchOwner(e.target.value)} style={{width:120}} />
                <Input placeholder="DOI" value={searchDoi} onChange={e=>setSearchDoi(e.target.value)} style={{width:120}} />
                <Button type="primary" onClick={handleSearch} disabled={!searchOwner&&!searchDoi}>Tìm kiếm</Button>
              </Space>
            ),
          },
        ]}
      />
      {message && <Typography.Paragraph style={{marginTop:16}}>{message}</Typography.Paragraph>}
      {result && (
        <Card type="inner" style={{marginTop:16}}>
          <pre style={{margin:0}}>{JSON.stringify(result, null, 2)}</pre>
        </Card>
      )}
    </Card>
  );
}
