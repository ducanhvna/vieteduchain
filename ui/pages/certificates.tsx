import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import CredentialCard from '../components/CredentialCard';
import QRCodeDisplay from '../components/QRCodeDisplay';

interface Certificate {
  certificate_id: string;
  course_id: string;
  student: string;
  issuer: string;
  issue_date: number;
  metadata_uri: string;
  revoked: boolean;
}

interface Degree {
  degree_id: string;
  student: string;
  issuer: string;
  certificate_ids: string[];
  degree_type: string;
  issue_date: number;
  metadata_uri: string;
  revoked: boolean;
}

interface QRCodeData {
  data_type: string;
  id: string;
  verify_url: string;
  qr_image: string;
}

export default function CertificateManagement() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'certificates' | 'degrees'>('certificates');
  const [currentStudent, setCurrentStudent] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [selectedDegree, setSelectedDegree] = useState<Degree | null>(null);

  useEffect(() => {
    if (currentStudent) {
      fetchStudentData();
    } else {
      setLoading(false);
    }
  }, [currentStudent, currentView]);

  async function fetchStudentData() {
    setLoading(true);
    try {
      if (currentView === 'certificates') {
        const res = await fetch(`${API_BASE_URL}/api/edumarket/certificate/student/${currentStudent}`);
        if (!res.ok) {
          throw new Error('Failed to fetch certificates');
        }
        const data = await res.json();
        setCertificates(data);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/edumarket/degree/student/${currentStudent}`);
        if (!res.ok) {
          throw new Error('Failed to fetch degrees');
        }
        const data = await res.json();
        setDegrees(data);
      }
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }

  async function generateQRCode(type: 'certificate' | 'degree', id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/qrcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_type: type,
          id: id,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const data = await res.json();
      setQRCodeData(data);
      setShowQRCode(true);
    } catch (e: any) {
      setError(e.message || 'Error generating QR code');
    }
  }

  async function revokeCertificate(certificateId: string) {
    if (!confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/certificate/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Node-Id': 'node1', // Use appropriate node ID
        },
        body: JSON.stringify({
          certificate_id: certificateId
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to revoke certificate');
      }
      
      // Refresh data
      fetchStudentData();
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error revoking certificate');
    }
  }

  async function revokeDegree(degreeId: string) {
    if (!confirm('Are you sure you want to revoke this degree? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/degree/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Node-Id': 'node1', // Use appropriate node ID
        },
        body: JSON.stringify({
          degree_id: degreeId
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to revoke degree');
      }
      
      // Refresh data
      fetchStudentData();
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error revoking degree');
    }
  }

  // Format timestamp from unix to readable date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 32 }}>Certificate Management</h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, gap: 16 }}>
        <button
          onClick={() => setCurrentView('certificates')}
          style={{
            padding: '10px 20px',
            background: currentView === 'certificates' ? '#1890ff' : '#f0f0f0',
            color: currentView === 'certificates' ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Certificates
        </button>
        <button
          onClick={() => setCurrentView('degrees')}
          style={{
            padding: '10px 20px',
            background: currentView === 'degrees' ? '#1890ff' : '#f0f0f0',
            color: currentView === 'degrees' ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Degrees
        </button>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Enter student address"
            value={currentStudent}
            onChange={(e) => setCurrentStudent(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 400 }}
          />
          <button
            onClick={fetchStudentData}
            style={{ 
              marginLeft: 8,
              padding: '8px 16px',
              background: '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </div>
      </div>
      
      {error && (
        <div style={{ color: 'red', textAlign: 'center', marginBottom: 16, padding: 8, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 4 }}>
          {error}
        </div>
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>Loading data...</div>
      ) : currentStudent ? (
        <div>
          {currentView === 'certificates' ? (
            <>
              <h2>Certificates for {currentStudent}</h2>
              {certificates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, background: '#f9f9f9', borderRadius: 8 }}>
                  No certificates found for this student.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
                  {certificates.map((cert) => (
                    <CredentialCard
                      key={cert.certificate_id}
                      title={`Certificate for ${cert.course_id}`}
                      id={cert.certificate_id}
                      issuer={cert.issuer}
                      issueDate={formatDate(cert.issue_date)}
                      metadata={cert.metadata_uri}
                      status={cert.revoked ? 'revoked' : 'active'}
                      onView={() => {
                        setSelectedCertificate(cert);
                        setSelectedDegree(null);
                      }}
                      onQRCode={() => generateQRCode('certificate', cert.certificate_id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2>Degrees for {currentStudent}</h2>
              {degrees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, background: '#f9f9f9', borderRadius: 8 }}>
                  No degrees found for this student.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
                  {degrees.map((degree) => (
                    <CredentialCard
                      key={degree.degree_id}
                      title={`${degree.degree_type} Degree`}
                      id={degree.degree_id}
                      issuer={degree.issuer}
                      issueDate={formatDate(degree.issue_date)}
                      metadata={degree.metadata_uri}
                      status={degree.revoked ? 'revoked' : 'active'}
                      onView={() => {
                        setSelectedDegree(degree);
                        setSelectedCertificate(null);
                      }}
                      onQRCode={() => generateQRCode('degree', degree.degree_id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 32, background: '#f1f3f4', borderRadius: 8 }}>
          Enter a student address to view their certificates and degrees.
        </div>
      )}
      
      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            width: '80%',
            maxWidth: 700,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>Certificate Details</h2>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Certificate ID:</strong> {selectedCertificate.certificate_id}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Course ID:</strong> {selectedCertificate.course_id}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Student:</strong> {selectedCertificate.student}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Issuer:</strong> {selectedCertificate.issuer}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Issue Date:</strong> {formatDate(selectedCertificate.issue_date)}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Metadata URI:</strong> <a href={selectedCertificate.metadata_uri} target="_blank" rel="noopener noreferrer">{selectedCertificate.metadata_uri}</a>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Status:</strong> <span style={{ color: selectedCertificate.revoked ? '#ff4d4f' : '#52c41a' }}>{selectedCertificate.revoked ? 'Revoked' : 'Active'}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
              <div>
                <button 
                  onClick={() => generateQRCode('certificate', selectedCertificate.certificate_id)}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#1890ff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Generate QR Code
                </button>
                {!selectedCertificate.revoked && (
                  <button 
                    onClick={() => revokeCertificate(selectedCertificate.certificate_id)}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#ff4d4f', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginLeft: 8
                    }}
                  >
                    Revoke Certificate
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectedCertificate(null)}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#f0f0f0', 
                  border: 'none', 
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Degree Detail Modal */}
      {selectedDegree && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            width: '80%',
            maxWidth: 700,
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>{selectedDegree.degree_type} Degree Details</h2>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Degree ID:</strong> {selectedDegree.degree_id}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Degree Type:</strong> {selectedDegree.degree_type}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Student:</strong> {selectedDegree.student}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Issuer:</strong> {selectedDegree.issuer}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Issue Date:</strong> {formatDate(selectedDegree.issue_date)}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Metadata URI:</strong> <a href={selectedDegree.metadata_uri} target="_blank" rel="noopener noreferrer">{selectedDegree.metadata_uri}</a>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Status:</strong> <span style={{ color: selectedDegree.revoked ? '#ff4d4f' : '#52c41a' }}>{selectedDegree.revoked ? 'Revoked' : 'Active'}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Included Certificates:</strong> 
                <ul style={{ marginTop: 4 }}>
                  {selectedDegree.certificate_ids.map(certId => (
                    <li key={certId} style={{ fontFamily: 'monospace' }}>{certId}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
              <div>
                <button 
                  onClick={() => generateQRCode('degree', selectedDegree.degree_id)}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#1890ff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Generate QR Code
                </button>
                {!selectedDegree.revoked && (
                  <button 
                    onClick={() => revokeDegree(selectedDegree.degree_id)}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#ff4d4f', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginLeft: 8
                    }}
                  >
                    Revoke Degree
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSelectedDegree(null)}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#f0f0f0', 
                  border: 'none', 
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* QR Code Modal */}
      {showQRCode && qrCodeData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            width: '80%',
            maxWidth: 400
          }}>
            <QRCodeDisplay 
              qrImage={qrCodeData.qr_image}
              title={`QR Code for ${qrCodeData.data_type} ${qrCodeData.id}`}
              verifyUrl={qrCodeData.verify_url}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button 
                onClick={() => setShowQRCode(false)}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#f0f0f0', 
                  border: 'none', 
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
