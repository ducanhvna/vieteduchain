import React from 'react';
import Image from 'next/image';

interface QRCodeDisplayProps {
  qrImage: string;
  title: string;
  verifyUrl: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ qrImage, title, verifyUrl }) => {
  return (
    <div className="qr-code-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '1rem', 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      margin: '1rem 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      
      {qrImage && (
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '1rem 0' }}>
          <Image 
            src={`data:image/png;base64,${qrImage}`} 
            alt={`QR code for ${title}`}
            layout="fill"
            objectFit="contain"
          />
        </div>
      )}
      
      <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
        Scan to verify or use link below:
      </p>
      
      <a 
        href={verifyUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          color: '#0070f3', 
          textDecoration: 'none',
          wordBreak: 'break-all',
          textAlign: 'center'
        }}
      >
        {verifyUrl}
      </a>
    </div>
  );
};

export default QRCodeDisplay;
