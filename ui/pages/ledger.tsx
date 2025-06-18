import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

interface TransactionRecord {
  tx_id: string;
  tx_type: string;
  initiator: string;
  details: string;
  timestamp: number;
}

export default function BlockchainLedger() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(50);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchTransactions();
  }, [limit]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/edu-cert/transactions?limit=${limit}`);
      if (!res.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      const data = await res.json();
      setTransactions(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error fetching transaction history');
    } finally {
      setLoading(false);
    }
  }

  // Convert Unix timestamp to readable date
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Filter transactions based on search term
  const filteredTransactions = filter
    ? transactions.filter(tx => 
        tx.tx_id.toLowerCase().includes(filter.toLowerCase()) ||
        tx.tx_type.toLowerCase().includes(filter.toLowerCase()) ||
        tx.initiator.toLowerCase().includes(filter.toLowerCase()) ||
        tx.details.toLowerCase().includes(filter.toLowerCase())
      )
    : transactions;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Blockchain Ledger - Transaction History</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <label htmlFor="limit" style={{ marginRight: 8 }}>Show entries:</label>
          <select 
            id="limit" 
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
        
        <div>
          <input
            type="text"
            placeholder="Search transactions..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 250 }}
          />
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>Loading transaction history...</div>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center', padding: 16 }}>{error}</div>
      ) : filteredTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32 }}>No transactions found.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f3f4' }}>
                <th style={{ padding: 12, border: '1px solid #e0e0e0', textAlign: 'left' }}>Transaction ID</th>
                <th style={{ padding: 12, border: '1px solid #e0e0e0', textAlign: 'left' }}>Type</th>
                <th style={{ padding: 12, border: '1px solid #e0e0e0', textAlign: 'left' }}>Initiator</th>
                <th style={{ padding: 12, border: '1px solid #e0e0e0', textAlign: 'left' }}>Details</th>
                <th style={{ padding: 12, border: '1px solid #e0e0e0', textAlign: 'left' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx.tx_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12, border: '1px solid #e0e0e0', fontFamily: 'monospace' }}>{tx.tx_id}</td>
                  <td style={{ padding: 12, border: '1px solid #e0e0e0' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: tx.tx_type.includes('mint') ? '#e6f7ff' : 
                                  tx.tx_type.includes('transfer') ? '#f6ffed' :
                                  tx.tx_type.includes('burn') ? '#fff2e8' :
                                  tx.tx_type.includes('revoke') ? '#fff1f0' : '#f9f0ff',
                      color: tx.tx_type.includes('mint') ? '#1890ff' :
                             tx.tx_type.includes('transfer') ? '#52c41a' :
                             tx.tx_type.includes('burn') ? '#fa8c16' :
                             tx.tx_type.includes('revoke') ? '#f5222d' : '#722ed1',
                    }}>
                      {tx.tx_type}
                    </span>
                  </td>
                  <td style={{ padding: 12, border: '1px solid #e0e0e0', fontFamily: 'monospace', fontSize: '0.9em' }}>{tx.initiator}</td>
                  <td style={{ padding: 12, border: '1px solid #e0e0e0', wordBreak: 'break-all' }}>{tx.details}</td>
                  <td style={{ padding: 12, border: '1px solid #e0e0e0' }}>{formatTimestamp(tx.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  );
}
