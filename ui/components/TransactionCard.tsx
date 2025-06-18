import React from 'react';

interface TransactionCardProps {
  txId: string;
  txType: string;
  initiator: string;
  details: string;
  timestamp: number;
  onView?: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  txId, 
  txType, 
  initiator, 
  details, 
  timestamp,
  onView
}) => {
  // Convert Unix timestamp to readable date
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Determine background and text color based on transaction type
  const getTypeStyle = (type: string) => {
    if (type.includes('mint')) {
      return { bg: '#e6f7ff', color: '#1890ff', border: '#91d5ff' };
    } else if (type.includes('transfer')) {
      return { bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f' };
    } else if (type.includes('burn')) {
      return { bg: '#fff2e8', color: '#fa8c16', border: '#ffbb96' };
    } else if (type.includes('revoke')) {
      return { bg: '#fff1f0', color: '#f5222d', border: '#ffa39e' };
    } else {
      return { bg: '#f9f0ff', color: '#722ed1', border: '#d3adf7' };
    }
  };

  const typeStyle = getTypeStyle(txType);

  return (
    <div style={{ 
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px', 
            fontSize: '0.8rem',
            backgroundColor: typeStyle.bg,
            color: typeStyle.color,
            border: `1px solid ${typeStyle.border}`
          }}>
            {txType}
          </span>
          <span style={{ marginLeft: '0.5rem', color: '#888', fontSize: '0.8rem' }}>
            {formatTimestamp(timestamp)}
          </span>
        </div>
        {onView && (
          <button 
            onClick={onView} 
            style={{ 
              padding: '0.25rem 0.5rem', 
              backgroundColor: '#1890ff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            View Details
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>Transaction ID:</span>
        <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{txId}</span>
      </div>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>Initiator:</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>{initiator}</span>
      </div>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>Details:</span>
        <span style={{ wordBreak: 'break-all' }}>{details}</span>
      </div>
    </div>
  );
};

export default TransactionCard;
