import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface CourseNFT {
  id: string;
  creator: string;
  owner: string;
  metadata: string;
  price: string;
  sold: boolean;
  completed_by: string[];
}

interface CourseProgression {
  student: string;
  course_id: string;
  progress: number;
  completed: boolean;
  completion_date: number | null;
  certificate_id: string | null;
}

export default function CourseCompletion() {
  // Course and student information
  const [courseId, setCourseId] = useState<string>('');
  const [student, setStudent] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  
  // Certificate information
  const [certificateId, setCertificateId] = useState<string>('');
  const [metadataUri, setMetadataUri] = useState<string>('');
  
  // Data
  const [availableCourses, setAvailableCourses] = useState<CourseNFT[]>([]);
  const [courseProgression, setCourseProgression] = useState<CourseProgression | null>(null);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'update-progress' | 'complete-course' | 'issue-certificate'>('update-progress');

  // Fetch available courses on initial render
  useEffect(() => {
    fetchAvailableCourses();
  }, []);

  // Fetch course progression when course and student are selected
  useEffect(() => {
    if (courseId && student) {
      fetchCourseProgression();
    } else {
      setCourseProgression(null);
    }
  }, [courseId, student]);

  async function fetchAvailableCourses() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket`);
      if (!res.ok) {
        throw new Error('Failed to fetch available courses');
      }
      
      const data = await res.json();
      setAvailableCourses(data);
    } catch (e: any) {
      setError(e.message || 'Error fetching available courses');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourseProgression() {
    if (!courseId || !student) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/course/progress/${student}/${courseId}`);
      
      if (res.status === 404) {
        setCourseProgression(null);
        setError('No enrollment found for this student and course');
        return;
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch course progression');
      }
      
      const data = await res.json();
      setCourseProgression(data);
      setProgress(data.progress);
    } catch (e: any) {
      setError(e.message || 'Error fetching course progression');
    } finally {
      setLoading(false);
    }
  }

  async function updateProgress() {
    if (!courseId || !student) {
      setError('Please select a course and enter a student address');
      return;
    }
    
    if (progress < 0 || progress > 100) {
      setError('Progress must be between 0 and 100');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/course/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Node-Id': 'node1', // Should be dynamically set based on user's node
        },
        body: JSON.stringify({
          student: student,
          course_id: courseId,
          progress: progress
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to update progress');
      }
      
      setSuccess(`Progress updated to ${progress}%`);
      
      // Refresh course progression
      await fetchCourseProgression();
    } catch (e: any) {
      setError(e.message || 'Error updating progress');
    } finally {
      setLoading(false);
    }
  }

  async function completeCourse() {
    if (!courseId || !student) {
      setError('Please select a course and enter a student address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/course/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Node-Id': 'node1', // Should be dynamically set based on user's node
        },
        body: JSON.stringify({
          student: student,
          course_id: courseId
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to complete course');
      }
      
      setSuccess('Course marked as completed');
      
      // Refresh course progression
      await fetchCourseProgression();
    } catch (e: any) {
      setError(e.message || 'Error completing course');
    } finally {
      setLoading(false);
    }
  }

  async function issueCertificate() {
    if (!courseId || !student || !certificateId || !metadataUri) {
      setError('Please fill all required fields');
      return;
    }
    
    if (!courseProgression?.completed) {
      setError('Student must complete the course before issuing a certificate');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/edumarket/certificate/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Node-Id': 'node1', // Should be dynamically set based on user's node
        },
        body: JSON.stringify({
          certificate_id: certificateId,
          course_id: courseId,
          student: student,
          metadata_uri: metadataUri
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to issue certificate');
      }
      
      setSuccess('Certificate issued successfully');
      
      // Refresh course progression
      await fetchCourseProgression();
      
      // Reset certificate form
      setCertificateId('');
      setMetadataUri('');
    } catch (e: any) {
      setError(e.message || 'Error issuing certificate');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp: number | null): string {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Course Completion & Certification</h1>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, gap: 16 }}>
        <button
          onClick={() => setCurrentAction('update-progress')}
          style={{
            padding: '10px 20px',
            background: currentAction === 'update-progress' ? '#1890ff' : '#f0f0f0',
            color: currentAction === 'update-progress' ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Update Progress
        </button>
        <button
          onClick={() => setCurrentAction('complete-course')}
          style={{
            padding: '10px 20px',
            background: currentAction === 'complete-course' ? '#1890ff' : '#f0f0f0',
            color: currentAction === 'complete-course' ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Complete Course
        </button>
        <button
          onClick={() => setCurrentAction('issue-certificate')}
          style={{
            padding: '10px 20px',
            background: currentAction === 'issue-certificate' ? '#1890ff' : '#f0f0f0',
            color: currentAction === 'issue-certificate' ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Issue Certificate
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
      
      <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2>Student & Course Information</h2>
        
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              style={{ 
                width: '100%',
                padding: 8,
                borderRadius: 4,
                border: '1px solid #d9d9d9'
              }}
            >
              <option value="">Select a course</option>
              {availableCourses.map(course => (
                <option key={course.id} value={course.id}>{course.id} - {course.metadata}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>Student Address</label>
            <input
              type="text"
              placeholder="Enter student address"
              value={student}
              onChange={(e) => setStudent(e.target.value)}
              style={{ 
                width: '100%',
                padding: 8,
                borderRadius: 4,
                border: '1px solid #d9d9d9'
              }}
            />
          </div>
        </div>
        
        {courseProgression && (
          <div style={{ 
            marginBottom: 24,
            padding: 16,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ marginTop: 0 }}>Course Progression</h3>
            <div style={{ marginBottom: 8 }}>
              <strong>Progress:</strong> {courseProgression.progress}%
              <div style={{ 
                marginTop: 4,
                height: 8,
                width: '100%',
                backgroundColor: '#e0e0e0',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%',
                  width: `${courseProgression.progress}%`,
                  backgroundColor: '#1890ff',
                  borderRadius: 4
                }} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Completed:</strong> {courseProgression.completed ? 'Yes' : 'No'}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Completion Date:</strong> {formatDate(courseProgression.completion_date)}
            </div>
            <div>
              <strong>Certificate:</strong> {courseProgression.certificate_id || 'Not issued'}
            </div>
          </div>
        )}
        
        {currentAction === 'update-progress' && (
          <div>
            <h3>Update Course Progress</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>Progress (%)</label>
              <input
                type="number"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                min={0}
                max={100}
                style={{ 
                  width: '100%',
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}
              />
            </div>
            
            <button
              onClick={updateProgress}
              disabled={loading || !courseId || !student}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                opacity: (loading || !courseId || !student) ? 0.5 : 1
              }}
            >
              {loading ? 'Updating...' : 'Update Progress'}
            </button>
          </div>
        )}
        
        {currentAction === 'complete-course' && (
          <div>
            <h3>Mark Course as Completed</h3>
            <p>
              This will mark the course as 100% completed and set the completion date.
              Only instructors (course creators) can mark a course as completed.
            </p>
            
            <button
              onClick={completeCourse}
              disabled={loading || !courseId || !student}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                opacity: (loading || !courseId || !student) ? 0.5 : 1
              }}
            >
              {loading ? 'Processing...' : 'Mark as Completed'}
            </button>
          </div>
        )}
        
        {currentAction === 'issue-certificate' && (
          <div>
            <h3>Issue Course Completion Certificate</h3>
            <p>
              Issue a certificate for a completed course. The course must be marked as completed first.
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>Certificate ID</label>
              <input
                type="text"
                placeholder="Enter a unique certificate ID"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                style={{ 
                  width: '100%',
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
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
            
            <button
              onClick={issueCertificate}
              disabled={loading || !courseId || !student || !certificateId || !metadataUri || !courseProgression?.completed}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#722ed1',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                opacity: (loading || !courseId || !student || !certificateId || !metadataUri || !courseProgression?.completed) ? 0.5 : 1
              }}
            >
              {loading ? 'Issuing...' : 'Issue Certificate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
