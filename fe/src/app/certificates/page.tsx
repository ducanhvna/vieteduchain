"use client";

import { useState } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, Button, Input, Form, Table, message as antdMessage, Space, Typography, Select, DatePicker } from 'antd';

const { Paragraph } = Typography;
const { Option } = Select;

export default function Page() {
  const [form] = Form.useForm();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateCertificate = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/create_certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_did: values.studentDid,
          certificate_type: values.certificateType,
          certificate_name: values.certificateName,
          issue_date: values.issueDate.format('YYYY-MM-DD'),
          issuer_did: values.issuerDid,
          metadata: values.metadata
        })
      });
      const data = await res.json();
      if (res.ok) {
        antdMessage.success('Certificate created successfully!');
        form.resetFields();
        fetchCertificates();
      } else {
        antdMessage.error(data.detail || 'Failed to create certificate');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/list_certificates`);
      if (res.ok) {
        const data = await res.json();
        setCertificates(data);
      } else {
        antdMessage.error('Failed to fetch certificates');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  const verifyCertificate = async (certId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/verify_certificate?certificate_id=${certId}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        antdMessage.success('Certificate verification successful!');
      } else {
        antdMessage.error(data.detail || 'Certificate verification failed');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    }
  };

  // Fetch certificates on component mount
  useState(() => {
    fetchCertificates();
  });

  return (
    <Card style={{ maxWidth: 900, margin: '32px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Certificate Management</h2>
      
      <Card title="Create New Certificate" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCertificate}
        >
          <Form.Item
            name="studentDid"
            label="Student DID"
            rules={[{ required: true, message: 'Please enter student DID' }]}
          >
            <Input placeholder="did:example:student123" />
          </Form.Item>
          
          <Form.Item
            name="certificateType"
            label="Certificate Type"
            rules={[{ required: true, message: 'Please select certificate type' }]}
          >
            <Select placeholder="Select certificate type">
              <Option value="degree">Degree</Option>
              <Option value="course">Course Certificate</Option>
              <Option value="achievement">Achievement</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="certificateName"
            label="Certificate Name"
            rules={[{ required: true, message: 'Please enter certificate name' }]}
          >
            <Input placeholder="Bachelor of Science in Computer Science" />
          </Form.Item>
          
          <Form.Item
            name="issueDate"
            label="Issue Date"
            rules={[{ required: true, message: 'Please select issue date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="issuerDid"
            label="Issuer DID"
            rules={[{ required: true, message: 'Please enter issuer DID' }]}
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
              Create Certificate
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <Card title="Certificate List">
        <Button 
          onClick={fetchCertificates} 
          style={{ marginBottom: 16 }}
          loading={loading}
        >
          Refresh Certificates
        </Button>
        
        <Table
          dataSource={certificates}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id' },
            { title: 'Type', dataIndex: 'certificate_type', key: 'type' },
            { title: 'Name', dataIndex: 'certificate_name', key: 'name' },
            { title: 'Issue Date', dataIndex: 'issue_date', key: 'date' },
            { title: 'Student DID', dataIndex: 'student_did', key: 'student' },
            { title: 'Issuer DID', dataIndex: 'issuer_did', key: 'issuer' },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Button 
                  onClick={() => verifyCertificate(record.id)}
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
