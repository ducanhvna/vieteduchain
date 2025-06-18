"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, Button, Input, Form, Table, message as antdMessage, Space, Typography, Select, DatePicker, InputNumber } from 'antd';

const { Paragraph } = Typography;
const { Option } = Select;

export default function Page() {
  const [form] = Form.useForm();
  const [courseCompletions, setCourseCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchCourseCompletions();
  }, []);

  const handleCreateCourseCompletion = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/create_course_completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_did: values.studentDid,
          course_id: values.courseId,
          course_name: values.courseName,
          completion_date: values.completionDate.format('YYYY-MM-DD'),
          grade: values.grade,
          credits: values.credits,
          instructor_did: values.instructorDid,
          institution_did: values.institutionDid,
          metadata: values.metadata
        })
      });
      const data = await res.json();
      if (res.ok) {
        antdMessage.success('Course completion record created successfully!');
        form.resetFields();
        fetchCourseCompletions();
      } else {
        antdMessage.error(data.detail || 'Failed to create course completion record');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseCompletions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/list_course_completions`);
      if (res.ok) {
        const data = await res.json();
        setCourseCompletions(data);
      } else {
        antdMessage.error('Failed to fetch course completion records');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  const verifyCourseCompletion = async (recordId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/verify_course_completion?record_id=${recordId}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        antdMessage.success('Course completion verification successful!');
      } else {
        antdMessage.error(data.detail || 'Course completion verification failed');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    }
  };

  return (
    <Card style={{ maxWidth: 900, margin: '32px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Course Completion Management</h2>
      
      <Card title="Record New Course Completion" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCourseCompletion}
        >
          <Form.Item
            name="studentDid"
            label="Student DID"
            rules={[{ required: true, message: 'Please enter student DID' }]}
          >
            <Input placeholder="did:example:student123" />
          </Form.Item>
          
          <Form.Item
            name="courseId"
            label="Course ID"
            rules={[{ required: true, message: 'Please enter course ID' }]}
          >
            <Input placeholder="CS101" />
          </Form.Item>
          
          <Form.Item
            name="courseName"
            label="Course Name"
            rules={[{ required: true, message: 'Please enter course name' }]}
          >
            <Input placeholder="Introduction to Computer Science" />
          </Form.Item>
          
          <Form.Item
            name="completionDate"
            label="Completion Date"
            rules={[{ required: true, message: 'Please select completion date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="grade"
            label="Grade"
            rules={[{ required: true, message: 'Please enter grade' }]}
          >
            <Input placeholder="A" />
          </Form.Item>
          
          <Form.Item
            name="credits"
            label="Credits"
            rules={[{ required: true, message: 'Please enter credits' }]}
          >
            <InputNumber min={0} placeholder="3" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="instructorDid"
            label="Instructor DID"
            rules={[{ required: true, message: 'Please enter instructor DID' }]}
          >
            <Input placeholder="did:example:instructor123" />
          </Form.Item>
          
          <Form.Item
            name="institutionDid"
            label="Institution DID"
            rules={[{ required: true, message: 'Please enter institution DID' }]}
          >
            <Input placeholder="did:example:university123" />
          </Form.Item>
          
          <Form.Item
            name="metadata"
            label="Metadata (Optional)"
          >
            <Input.TextArea placeholder="Additional information in JSON format" rows={4} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Course Completion Record
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <Card title="Course Completion Records">
        <Button 
          onClick={fetchCourseCompletions} 
          style={{ marginBottom: 16 }}
          loading={loading}
        >
          Refresh Records
        </Button>
        
        <Table
          dataSource={courseCompletions}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id' },
            { title: 'Course ID', dataIndex: 'course_id', key: 'courseId' },
            { title: 'Course Name', dataIndex: 'course_name', key: 'courseName' },
            { title: 'Student DID', dataIndex: 'student_did', key: 'studentDid' },
            { title: 'Completion Date', dataIndex: 'completion_date', key: 'completionDate' },
            { title: 'Grade', dataIndex: 'grade', key: 'grade' },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Button 
                  onClick={() => verifyCourseCompletion(record.id)}
                  size="small"
                >
                  Verify
                </Button>
              ),
            },
          ]}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          loading={loading}
        />
      </Card>
      
      {result && (
        <Card title="Verification Result" style={{ marginTop: 24 }}>
          <Paragraph copyable>{JSON.stringify(result, null, 2)}</Paragraph>
        </Card>
      )}
    </Card>
  );
}
