import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface CourseNFT {
  id: string;
  creator: string;
  owner: string;
  metadata: string;
  price: string;
  sold: boolean;
}

export default function EduMarket() {
  const [nfts, setNfts] = useState<CourseNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mintData, setMintData] = useState({ id: '', metadata: '', price: '', creator: '' });
  const [buyId, setBuyId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchNFTs();
  }, []);

  async function fetchNFTs() {
    setLoading(true);
    try {
      const res = await axios.get('/api/edumarket');
      setNfts(res.data);
      setError(null);
    } catch (e: any) {
      setError('Failed to load NFTs');
    }
    setLoading(false);
  }

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/edumarket/mint', {
        ...mintData,
        price: mintData.price,
      });
      setMessage('Minted successfully!');
      setMintData({ id: '', metadata: '', price: '', creator: '' });
      fetchNFTs();
    } catch (e: any) {
      setMessage(e.response?.data?.detail || 'Mint failed');
    }
  }

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/edumarket/buy', {
        id: buyId,
        buyer,
        amount,
      });
      setMessage('Bought successfully!');
      setBuyId('');
      setBuyer('');
      setAmount('');
      fetchNFTs();
    } catch (e: any) {
      setMessage(e.response?.data?.detail || 'Buy failed');
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>EduMarket – Course NFT Marketplace</h1>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 40 }}>
        {/* Mint NFT Group */}
        <div style={{ flex: 1, minWidth: 320, background: '#f8f9fa', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #eee' }}>
          <h2 style={{ marginTop: 0 }}>Mint Course NFT</h2>
          <form onSubmit={handleMint}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="ID" value={mintData.id} onChange={e => setMintData({ ...mintData, id: e.target.value })} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
              <input placeholder="Metadata" value={mintData.metadata} onChange={e => setMintData({ ...mintData, metadata: e.target.value })} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
              <input placeholder="Price" type="number" value={mintData.price} onChange={e => setMintData({ ...mintData, price: e.target.value })} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
              <input placeholder="Creator" value={mintData.creator} onChange={e => setMintData({ ...mintData, creator: e.target.value })} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
              <button type="submit" style={{ padding: 10, borderRadius: 6, background: '#0070f3', color: '#fff', border: 'none', fontWeight: 600 }}>Mint</button>
            </div>
          </form>
        </div>
        {/* Buy NFT Group */}
        <div style={{ flex: 1, minWidth: 320, background: '#f8f9fa', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #eee' }}>
          <h2 style={{ marginTop: 0 }}>Buy Course NFT</h2>
          <form onSubmit={handleBuy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Course ID" value={buyId} onChange={e => setBuyId(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
              <input placeholder="Buyer" value={buyer} onChange={e => setBuyer(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
              <input placeholder="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
              <button type="submit" style={{ padding: 10, borderRadius: 6, background: '#00b894', color: '#fff', border: 'none', fontWeight: 600 }}>Buy</button>
            </div>
          </form>
        </div>
      </div>
      {message && <div style={{ color: 'green', marginBottom: 16, textAlign: 'center', fontWeight: 500 }}>{message}</div>}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>All Course NFTs</h2>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : nfts.length === 0 ? (
          <div>No NFTs found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ background: '#f1f3f4' }}>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>ID</th>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Metadata</th>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Price</th>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Creator</th>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Owner</th>
                  <th style={{ padding: 8, border: '1px solid #e0e0e0' }}>Sold</th>
                </tr>
              </thead>
              <tbody>
                {nfts.map(nft => (
                  <tr key={nft.id} style={{ background: nft.sold ? '#f9fbe7' : '#fff' }}>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>{nft.id}</td>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>{nft.metadata}</td>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>{nft.price}</td>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>{nft.creator}</td>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>{nft.owner}</td>
                    <td style={{ padding: 8, border: '1px solid #e0e0e0' }}>{nft.sold ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
