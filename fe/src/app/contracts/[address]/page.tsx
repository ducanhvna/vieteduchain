"use client";

import { useState, useEffect } from 'react';
import { Card, Typography, Spin, Alert, Descriptions, Button, Tag, Space } from 'antd';
import { NODEINFO_URL } from '@/config';
import { useParams, useRouter } from 'next/navigation';

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

export default function ContractDetail() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;

  useEffect(() => {
    async function fetchContractDetails() {
      if (!address) return;
      
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${NODEINFO_URL}/api/v1/contracts/${address}`);
        if (!response.ok) {
          throw new Error(`Error fetching contract details: ${response.statusText}`);
        }
        const data = await response.json();
        setContract(data);
      } catch (err: any) {
        console.error("Error fetching contract details:", err);
        setError(err.message || "Failed to fetch contract details");
      } finally {
        setLoading(false);
      }
    }
    
    fetchContractDetails();
  }, [address]);

  return (
    <Card style={{ padding: 24, maxWidth: 1000, margin: '24px auto' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={3}>
          Contract Details
        </Typography.Title>
        <Button onClick={() => router.back()}>
          Back to Contracts
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="large" />
          <Typography.Text style={{ display: 'block', marginTop: 16 }}>
            Loading contract details...
          </Typography.Text>
        </div>
      ) : contract ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Name">{contract.name}</Descriptions.Item>
          <Descriptions.Item label="Address">
            <Typography.Text copyable>{contract.address}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            <Tag color={
              contract.type === 'identity' ? 'blue' : 
              contract.type === 'certification' ? 'green' : 
              contract.type === 'payment' ? 'gold' : 'default'
            }>
              {contract.type.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Code ID">{contract.code_id}</Descriptions.Item>
          <Descriptions.Item label="Creator">
            <Typography.Text copyable>{contract.creator}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Admin">
            <Typography.Text copyable>{contract.admin}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Version">{contract.version}</Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(contract.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {new Date(contract.last_updated).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Features">
            <Space size={[0, 4]} wrap>
              {contract.features.map(feature => (
                <Tag key={feature} color="processing">
                  {feature}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {contract.metadata.description}
          </Descriptions.Item>
          <Descriptions.Item label="Website">
            <Typography.Link href={contract.metadata.website} target="_blank">
              {contract.metadata.website}
            </Typography.Link>
          </Descriptions.Item>
          <Descriptions.Item label="Repository">
            <Typography.Link href={contract.metadata.repository} target="_blank">
              {contract.metadata.repository}
            </Typography.Link>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert 
          type="warning" 
          message="Contract not found" 
          description="The requested contract could not be found or does not exist."
        />
      )}
    </Card>
  );
}
