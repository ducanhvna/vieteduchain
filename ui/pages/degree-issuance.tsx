import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface Certificate {
  certificate_id: string;
  course_id: string;
  student: string;
  issuer: string;
  issue_date: number;
  metadata_uri: string;
  revoked: boolean;
}

interface DegreeRequirements {
  degree_type: string;
  required_courses: string[];
  required_credits: number;
  minimum_gpa: number | null;
}

interface EligibilityResponse {
  eligible: boolean;
  missing_courses: string[];
  completed_courses: string[];
}

export default function DegreeIssuance() {
  // Student information
  const [student, setStudent] = useState<string>('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);

  // Degree information
  const [degreeId, setDegreeId] = useState<string>('');
  const [degreeType, setDegreeType] = useState<string>('');
  const [metadataUri, setMetadataUri] = useState<string>('');
  
  // Degree requirements
  const [availableDegreeTypes, setAvailableDegreeTypes] = useState<string[]>([
    'Bachelor of Science', 
    'Master of Science', 
    'Bachelor of Arts', 
    'PhD',
    'Associate Degree'
  ]);
  const [eligibilityStatus, setEligibilityStatus] = useState<EligibilityResponse | null>(null);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [issuanceMode, setIssuanceMode] = useState<boolean>(true);
  const [requirementsMode, setRequirementsMode] = useState<boolean>(false);
  
  // Requirements form
  const [newDegreeType, setNewDegreeType] = useState<string>('');
  const [requiredCourses, setRequiredCourses] = useState<string>('');
  const [requiredCredits, setRequiredCredits] = useState<number>(120);
  const [minimumGpa, setMinimumGpa] = useState<string>('');
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);

  // Load available courses on initial render
  useEffect(() => {
    fetchAvailableCourses();
  }, []);

  async function fetchAvailableCourses() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket`);
      if (!res.ok) {
        throw new Error('Failed to fetch available courses');
      }
      const data = await res.json();
      const courseIds = data.map((course: any) => course.id);
      setAvailableCourses(courseIds);
    } catch (e: any) {
      setError(e.message || 'Error fetching available courses');
    }
  }

  async function fetchStudentCertificates() {
    if (!student) {
      setError('Please enter a student address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/certificate/student/${student}`);
      if (!res.ok) {
        throw new Error('Failed to fetch student certificates');
      }
      
      const data = await res.json();
      setCertificates(data);
      setSelectedCertificates([]);
    } catch (e: any) {
      setError(e.message || 'Error fetching student certificates');
    } finally {
      setLoading(false);
    }
  }

  async function checkEligibility() {
    if (!student || !degreeType) {
      setError('Please enter both student address and degree type');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/degree/check-eligibility/${student}/${encodeURIComponent(degreeType)}`);
      if (!res.ok) {
        throw new Error('Failed to check degree eligibility');
      }
      
      const data = await res.json();
      setEligibilityStatus(data);
      
      if (data.eligible) {
        setSuccess('Student is eligible for this degree!');
        // Pre-select all completed courses that are required for the degree
        setSelectedCertificates(certificates
          .filter(cert => data.completed_courses.includes(cert.course_id) && !cert.revoked)
          .map(cert => cert.certificate_id)
        );
      } else {
        setError(`Student is missing required courses: ${data.missing_courses.join(', ')}`);
      }
    } catch (e: any) {
      setError(e.message || 'Error checking eligibility');
    } finally {
      setLoading(false);
    }
  }

  async function issueDegree() {
    if (!student || !degreeId || !degreeType || !metadataUri || selectedCertificates.length === 0) {
      setError('Please fill all required fields and select at least one certificate');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/degree/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Node-Id': 'node1', // Should be dynamically set based on user's node
        },
        body: JSON.stringify({
          degree_id: degreeId,
          student: student,
          certificate_ids: selectedCertificates,
          degree_type: degreeType,
          metadata_uri: metadataUri
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to issue degree');
      }
      
      setSuccess('Degree issued successfully!');
      
      // Reset form
      setDegreeId('');
      setMetadataUri('');
      setSelectedCertificates([]);
    } catch (e: any) {
      setError(e.message || 'Error issuing degree');
    } finally {
      setLoading(false);
    }
  }

  async function setDegreeRequirements() {
    if (!newDegreeType || !requiredCourses || !requiredCredits) {
      setError('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const courses = requiredCourses.split(',').map(course => course.trim());
      const res = await fetch(`${API_BASE_URL}/api/edumarket/degree/requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Node-Id': 'node1', // Should be dynamically set based on user's node
        },
        body: JSON.stringify({
          degree_type: newDegreeType,
          required_courses: courses,
          required_credits: requiredCredits,
          minimum_gpa: minimumGpa ? parseFloat(minimumGpa) : null
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to set degree requirements');
      }
      
      setSuccess('Degree requirements set successfully!');
      
      // Reset form
      setNewDegreeType('');
      setRequiredCourses('');
      setRequiredCredits(120);
      setMinimumGpa('');
      
      // Add the new degree type to available types if not already there
      if (!availableDegreeTypes.includes(newDegreeType)) {
        setAvailableDegreeTypes([...availableDegreeTypes, newDegreeType]);
      }
    } catch (e: any) {
      setError(e.message || 'Error setting degree requirements');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDegreeRequirements() {
    if (!degreeType) {
      setError('Please select a degree type');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/degree/requirements/${encodeURIComponent(degreeType)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch degree requirements');
      }
      
      const data: DegreeRequirements = await res.json();
      setSuccess(`Requirements for ${degreeType}: ${data.required_credits} credits, courses: ${data.required_courses.join(', ')}`);
      
      if (data.minimum_gpa) {
        setSuccess(prev => `${prev}, minimum GPA: ${data.minimum_gpa}`);
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching degree requirements');
    } finally {
      setLoading(false);
    }
  }

  function toggleCertificate(certificateId: string) {
    if (selectedCertificates.includes(certificateId)) {
      setSelectedCertificates(selectedCertificates.filter(id => id !== certificateId));
    } else {
      setSelectedCertificates([...selectedCertificates, certificateId]);
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Degree Management</h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, gap: 16 }}>
        <button
          onClick={() => { setIssuanceMode(true); setRequirementsMode(false); }}
          style={{
            padding: '10px 20px',
            background: issuanceMode ? '#1890ff' : '#f0f0f0',
            color: issuanceMode ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Issue Degrees
        </button>
        <button
          onClick={() => { setIssuanceMode(false); setRequirementsMode(true); }}
          style={{
            padding: '10px 20px',
            background: requirementsMode ? '#1890ff' : '#f0f0f0',
            color: requirementsMode ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Manage Degree Requirements
        </button>
      </div>
      
      {error && (
        <div style={{ 
          padding: 16, 
          backgroundColor: '#fff1f0', 
          border: '1px solid #ffa39e',
          borderRadius: 4,
          marginBottom: 24,
          color: '#cf1322'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          padding: 16, 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: 4,
          marginBottom: 24,
          color: '#52c41a'
        }}>
          {success}
        </div>
      )}
      
      {issuanceMode && (
        <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2>Issue New Degree</h2>
          
          <div style={{ marginBottom: 24 }}>
            <h3>Step 1: Enter Student Information</h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Student address"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                style={{ 
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}
              />
              <button
                onClick={fetchStudentCertificates}
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Fetch Certificates
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <h3>Step 2: Enter Degree Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Degree ID</label>
                <input
                  type="text"
                  placeholder="Enter a unique degree ID"
                  value={degreeId}
                  onChange={(e) => setDegreeId(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Degree Type</label>
                <select
                  value={degreeType}
                  onChange={(e) => setDegreeType(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                  }}
                >
                  <option value="">Select a degree type</option>
                  {availableDegreeTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Metadata URI</label>
                <input
                  type="text"
                  placeholder="Enter metadata URI (e.g., IPFS link)"
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={checkEligibility}
                  disabled={!student || !degreeType}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#52c41a',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    opacity: (!student || !degreeType) ? 0.5 : 1
                  }}
                >
                  Check Eligibility
                </button>
                
                <button
                  onClick={fetchDegreeRequirements}
                  disabled={!degreeType}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#722ed1',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    opacity: !degreeType ? 0.5 : 1
                  }}
                >
                  View Requirements
                </button>
              </div>
            </div>
          </div>
          
          {certificates.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3>Step 3: Select Certificates for Degree</h3>
              <div style={{ 
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                padding: 16
              }}>
                {certificates.map(cert => (
                  <div 
                    key={cert.certificate_id}
                    style={{
                      padding: 12,
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: cert.revoked ? 0.5 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      id={cert.certificate_id}
                      checked={selectedCertificates.includes(cert.certificate_id)}
                      onChange={() => toggleCertificate(cert.certificate_id)}
                      disabled={cert.revoked}
                      style={{ marginRight: 12 }}
                    />
                    <label htmlFor={cert.certificate_id} style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{cert.course_id}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Certificate ID: {cert.certificate_id}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Issued: {formatDate(cert.issue_date)}
                      </div>
                      {cert.revoked && (
                        <div style={{ color: 'red', fontSize: '0.8rem' }}>
                          Certificate revoked
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              onClick={issueDegree}
              disabled={loading || !student || !degreeId || !degreeType || !metadataUri || selectedCertificates.length === 0}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                opacity: (loading || !student || !degreeId || !degreeType || !metadataUri || selectedCertificates.length === 0) ? 0.5 : 1
              }}
            >
              {loading ? 'Processing...' : 'Issue Degree'}
            </button>
          </div>
        </div>
      )}
      
      {requirementsMode && (
        <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2>Manage Degree Requirements</h2>
          
          <div style={{ marginBottom: 24 }}>
            <h3>Set Requirements for Degree Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Degree Type</label>
                <input
                  type="text"
                  placeholder="Enter degree type (e.g., Bachelor of Science)"
                  value={newDegreeType}
                  onChange={(e) => setNewDegreeType(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Required Courses (comma-separated course IDs)</label>
                <textarea
                  placeholder="e.g., CS101,MATH202,PHYS101"
                  value={requiredCourses}
                  onChange={(e) => setRequiredCourses(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9',
                    minHeight: '100px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Available Courses</label>
                <div style={{ 
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  padding: 8,
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {availableCourses.length === 0 ? (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>No courses available</div>
                  ) : (
                    availableCourses.map(course => (
                      <div key={course} style={{ 
                        marginBottom: 4,
                        padding: 4,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 2,
                        display: 'inline-block',
                        marginRight: 4
                      }}>
                        {course}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Required Credits</label>
                <input
                  type="number"
                  value={requiredCredits}
                  onChange={(e) => setRequiredCredits(Number(e.target.value))}
                  min={0}
                  style={{ 
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>Minimum GPA (optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 3.0"
                  value={minimumGpa}
                  onChange={(e) => setMinimumGpa(e.target.value)}
                  min={0}
                  max={4}
                  step={0.1}
                  style={{ 
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                  }}
                />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              onClick={setDegreeRequirements}
              disabled={loading || !newDegreeType || !requiredCourses || !requiredCredits}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                opacity: (loading || !newDegreeType || !requiredCourses || !requiredCredits) ? 0.5 : 1
              }}
            >
              {loading ? 'Processing...' : 'Set Degree Requirements'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
