"use client";

import { useEffect, useState } from 'react';
import { Card, Typography, Table, Space, Tag, Spin, Alert, Descriptions, Button, Modal } from 'antd';
import { NODEINFO_URL } from '@/config';

// Define the Contract interface based on the API response
interface Contract {
  name: string;
  address: string;
  creator: string;
  code_id: number;
  type: string;
  created_at: string;
  last_updated: string;
  version: string;
  features: string[];
  admin: string;
  metadata: {
    description: string;
    website: string;
    repository: string;
  };
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${NODEINFO_URL}/api/v1/contracts`);
        if (!response.ok) {
          throw new Error(`Error fetching contracts: ${response.statusText}`);
        }
        const data = await response.json();
        setContracts(data.contracts || []);
      } catch (err: any) {
        console.error("Error fetching contracts:", err);
        setError(err.message || "Failed to fetch contracts");
        setContracts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchContracts();
  }, []);

  const showContractDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Card style={{ padding: 24, maxWidth: 1200, margin: '24px auto' }}>
      <Typography.Title level={3}>Smart Contracts</Typography.Title>
      
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="large" />
          <Typography.Text style={{ display: 'block', marginTop: 16 }}>
            Loading contracts...
          </Typography.Text>
        </div>
      ) : (
        <Table 
          dataSource={contracts} 
          rowKey="address"
          pagination={false}
        >
          <Table.Column 
            title="Name" 
            dataIndex="name" 
            key="name"
            render={(text) => <Typography.Text strong>{text}</Typography.Text>}
          />
          <Table.Column 
            title="Type" 
            dataIndex="type" 
            key="type"
            render={(text) => (
              <Tag color={
                text === 'identity' ? 'blue' : 
                text === 'certification' ? 'green' : 
                text === 'payment' ? 'gold' : 'default'
              }>
                {text.toUpperCase()}
              </Tag>
            )}
          />
          <Table.Column 
            title="Address" 
            dataIndex="address" 
            key="address"
            ellipsis={true}
            render={(text) => (
              <Typography.Text copyable={{ text }} style={{ maxWidth: 180 }} ellipsis>
                {text}
              </Typography.Text>
            )}
          />
          <Table.Column 
            title="Version" 
            dataIndex="version" 
            key="version"
            render={(text) => <Tag>{text}</Tag>}
          />
          <Table.Column 
            title="Features" 
            dataIndex="features" 
            key="features"
            render={(features: string[]) => (
              <Space size={[0, 4]} wrap>
                {features.map(feature => (
                  <Tag key={feature} color="processing">
                    {feature}
                  </Tag>
                ))}
              </Space>
            )}
          />
          <Table.Column 
            title="Last Updated" 
            dataIndex="last_updated" 
            key="last_updated"
            render={(text) => new Date(text).toLocaleDateString()}
          />
          <Table.Column 
            title="Actions" 
            key="actions"
            render={(_, record: Contract) => (
              <Space>
                <Button type="primary" onClick={() => showContractDetails(record)}>
                  Quick View
                </Button>
                <Button 
                  onClick={() => window.location.href = `/contracts/${record.address}`}
                >
                  Full Details
                </Button>
              </Space>
            )}
          />
        </Table>
      )}

      {/* Contract Details Modal */}
      <Modal
        title={`Contract Details: ${selectedContract?.name}`}
        open={isModalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="close" onClick={closeModal}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedContract && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Name">{selectedContract.name}</Descriptions.Item>
            <Descriptions.Item label="Address">
              <Typography.Text copyable>{selectedContract.address}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={
                selectedContract.type === 'identity' ? 'blue' : 
                selectedContract.type === 'certification' ? 'green' : 
                selectedContract.type === 'payment' ? 'gold' : 'default'
              }>
                {selectedContract.type.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Code ID">{selectedContract.code_id}</Descriptions.Item>
            <Descriptions.Item label="Creator">
              <Typography.Text copyable>{selectedContract.creator}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Admin">
              <Typography.Text copyable>{selectedContract.admin}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Version">{selectedContract.version}</Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(selectedContract.created_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {new Date(selectedContract.last_updated).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Features">
              <Space size={[0, 4]} wrap>
                {selectedContract.features.map(feature => (
                  <Tag key={feature} color="processing">
                    {feature}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedContract.metadata.description}
            </Descriptions.Item>
            <Descriptions.Item label="Website">
              <Typography.Link href={selectedContract.metadata.website} target="_blank">
                {selectedContract.metadata.website}
              </Typography.Link>
            </Descriptions.Item>
            <Descriptions.Item label="Repository">
              <Typography.Link href={selectedContract.metadata.repository} target="_blank">
                {selectedContract.metadata.repository}
              </Typography.Link>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
}
