"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { Card, Button, Input, Form, Table, message as antdMessage, Space, Typography, Select, DatePicker, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;
const { Option } = Select;

export default function Page() {
  const [form] = Form.useForm();
  const [degrees, setDegrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchDegrees();
  }, []);

  const handleIssueDegree = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/edu-cert/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_req: {
            from: "issuer_address",
            chain_id: "educhain-1"
          },
          hash: values.credentialHash || generateCredentialHash(values),
          metadata: JSON.stringify({
            student_did: values.studentDid,
            degree_name: values.degreeName,
            degree_type: values.degreeType,
            major: values.major,
            graduation_date: values.graduationDate.format('YYYY-MM-DD'),
            gpa: values.gpa,
            honors: values.honors
          }),
          issuer: values.institutionDid,
          signature: values.signature || generateSignature(values)
        })
      });
      const data = await res.json();
      if (data.height && data.txhash) {
        antdMessage.success('Degree issued successfully!');
        form.resetFields();
        fetchDegrees();
      } else {
        antdMessage.error(data.detail || 'Failed to issue degree');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate credential hash if not provided
  const generateCredentialHash = (values: any) => {
    // In a real application, you would compute a cryptographic hash
    return `sha256-${Math.random().toString(36).substring(2, 15)}`;
  };

  // Helper function to generate signature if not provided
  const generateSignature = (values: any) => {
    // In a real application, this would be a cryptographic signature
    return `sig-${Math.random().toString(36).substring(2, 15)}`;
  };

  const fetchDegrees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/edu-cert/list`);
      if (res.ok) {
        const data = await res.json();
        setDegrees(data);
      } else {
        antdMessage.error('Failed to fetch degrees');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  const verifyDegree = async (credentialHash: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/edu-cert/verify/${credentialHash}`);
      const data = await res.json();
      if (res.ok && data.verified) {
        setResult(data);
        antdMessage.success('Degree verification successful!');
      } else {
        antdMessage.error(data.detail || 'Degree verification failed');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    }
  };

  return (
    <Card style={{ maxWidth: 900, margin: '32px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Degree Issuance Management</h2>
      
      <Card title="Issue New Degree" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleIssueDegree}
        >
          <Form.Item
            name="studentDid"
            label="Student DID"
            rules={[{ required: true, message: 'Please enter student DID' }]}
          >
            <Input placeholder="did:example:student123" />
          </Form.Item>
          
          <Form.Item
            name="degreeName"
            label="Degree Name"
            rules={[{ required: true, message: 'Please enter degree name' }]}
          >
            <Input placeholder="Bachelor of Science" />
          </Form.Item>
          
          <Form.Item
            name="degreeType"
            label="Degree Type"
            rules={[{ required: true, message: 'Please select degree type' }]}
          >
            <Select placeholder="Select degree type">
              <Option value="associate">Associate</Option>
              <Option value="bachelor">Bachelor</Option>
              <Option value="master">Master</Option>
              <Option value="doctoral">Doctoral</Option>
              <Option value="certificate">Certificate</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="major"
            label="Major/Field of Study"
            rules={[{ required: true, message: 'Please enter major' }]}
          >
            <Input placeholder="Computer Science" />
          </Form.Item>
          
          <Form.Item
            name="graduationDate"
            label="Graduation Date"
            rules={[{ required: true, message: 'Please select graduation date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="gpa"
            label="GPA"
            rules={[{ required: true, message: 'Please enter GPA' }]}
          >
            <Input placeholder="3.8" />
          </Form.Item>
          
          <Form.Item
            name="honors"
            label="Honors"
          >
            <Select placeholder="Select honors (if applicable)">
              <Option value="cum_laude">Cum Laude</Option>
              <Option value="magna_cum_laude">Magna Cum Laude</Option>
              <Option value="summa_cum_laude">Summa Cum Laude</Option>
              <Option value="none">None</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="institutionDid"
            label="Institution DID"
            rules={[{ required: true, message: 'Please enter institution DID' }]}
          >
            <Input placeholder="did:example:university123" />
          </Form.Item>
          
          <Form.Item
            name="signatureAuthority"
            label="Signature Authority"
            rules={[{ required: true, message: 'Please enter signature authority' }]}
          >
            <Input placeholder="Registrar" />
          </Form.Item>
          
          <Form.Item
            name="metadata"
            label="Metadata (Optional)"
          >
            <Input.TextArea placeholder="Additional information in JSON format" rows={4} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Issue Degree
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <Card title="Issued Degrees">
        <Button 
          onClick={fetchDegrees} 
          style={{ marginBottom: 16 }}
          loading={loading}
        >
          Refresh Degrees
        </Button>
        
        <Table
          dataSource={degrees}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id' },
            { title: 'Degree Name', dataIndex: 'degree_name', key: 'degreeName' },
            { title: 'Type', dataIndex: 'degree_type', key: 'degreeType' },
            { title: 'Major', dataIndex: 'major', key: 'major' },
            { title: 'Student DID', dataIndex: 'student_did', key: 'studentDid' },
            { title: 'Graduation Date', dataIndex: 'graduation_date', key: 'graduationDate' },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Button 
                  onClick={() => verifyDegree(record.id)}
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
