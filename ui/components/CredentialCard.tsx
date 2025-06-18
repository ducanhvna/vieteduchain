import React from 'react';

interface CredentialCardProps {
  title: string;
  id: string;
  issuer: string;
  issueDate: string;
  metadata: string;
  status: 'active' | 'revoked';
  onView?: () => void;
  onQRCode?: () => void;
}

const CredentialCard: React.FC<CredentialCardProps> = ({ 
  title, 
  id, 
  issuer, 
  issueDate, 
  metadata, 
  status,
  onView,
  onQRCode 
}) => {
  return (
    <div style={{ 
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      backgroundColor: status === 'active' ? 'white' : '#f9f9f9',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span style={{ 
          padding: '0.25rem 0.5rem', 
          borderRadius: '4px', 
          fontSize: '0.8rem',
          backgroundColor: status === 'active' ? '#e6f7ff' : '#fff1f0',
          color: status === 'active' ? '#1890ff' : '#ff4d4f',
          border: `1px solid ${status === 'active' ? '#91d5ff' : '#ffa39e'}`
        }}>
          {status === 'active' ? 'Active' : 'Revoked'}
        </span>
      </div>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>ID:</span>
        <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{id}</span>
      </div>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>Issuer:</span>
        <span>{issuer}</span>
      </div>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>Issue Date:</span>
        <span>{issueDate}</span>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#666', marginRight: '0.5rem' }}>Metadata:</span>
        <span style={{ wordBreak: 'break-all' }}>{metadata}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {onView && (
          <button 
            onClick={onView} 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#1890ff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            View Details
          </button>
        )}
        
        {onQRCode && (
          <button 
            onClick={onQRCode} 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#52c41a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Generate QR Code
          </button>
        )}
      </div>
    </div>
  );
};

export default CredentialCard;
