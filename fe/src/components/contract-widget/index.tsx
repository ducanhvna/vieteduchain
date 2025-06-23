"use client";

import { useEffect, useState } from 'react';
import { Card, Typography, Table, Space, Tag, Spin, Alert, Button } from 'antd';
import { NODEINFO_URL } from '@/config';
import { useRouter } from 'next/navigation';

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

interface ContractWidgetProps {
  contractAddress?: string;
  contractType?: string;
  maxDisplay?: number;
  title?: string;
  showViewAll?: boolean;
}

export default function ContractWidget({
  contractAddress,
  contractType,
  maxDisplay = 3,
  title = "Smart Contracts",
  showViewAll = true
}: ContractWidgetProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchContracts() {
      setLoading(true);
      setError('');
      try {
        // If we want a specific contract
        if (contractAddress) {
          const response = await fetch(`${NODEINFO_URL}/api/v1/contracts/${contractAddress}`);
          if (!response.ok) {
            throw new Error(`Error fetching contract: ${response.statusText}`);
          }
          const data = await response.json();
          setContracts([data]);
        } 
        // If we want contracts of a specific type
        else if (contractType) {
          const response = await fetch(`${NODEINFO_URL}/api/v1/contracts`);
          if (!response.ok) {
            throw new Error(`Error fetching contracts: ${response.statusText}`);
          }
          const data = await response.json();
          const filteredContracts = data.contracts.filter(
            (contract: Contract) => contract.type === contractType
          );
          setContracts(filteredContracts.slice(0, maxDisplay));
        } 
        // If we want all contracts
        else {
          const response = await fetch(`${NODEINFO_URL}/api/v1/contracts`);
          if (!response.ok) {
            throw new Error(`Error fetching contracts: ${response.statusText}`);
          }
          const data = await response.json();
          setContracts(data.contracts.slice(0, maxDisplay) || []);
        }
      } catch (err: any) {
        console.error("Error fetching contracts:", err);
        setError(err.message || "Failed to fetch contracts");
        setContracts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchContracts();
  }, [contractAddress, contractType, maxDisplay]);

  return (
    <Card 
      title="Smart Contracts" 
      extra={<Button type="link" href="/contracts">View All</Button>}
      style={{ marginTop: 16 }}
    >
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Loading contracts...
          </Typography.Text>
        </div>
      ) : (
        <Table 
          dataSource={contracts} 
          rowKey="address"
          pagination={false}
          size="small"
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
              <Typography.Text copyable={{ text }} style={{ maxWidth: 120 }} ellipsis>
                {text}
              </Typography.Text>
            )}
          />
          <Table.Column 
            title="Actions" 
            key="actions"
            render={(_, record: Contract) => (
              <Button 
                size="small" 
                type="primary" 
                onClick={() => router.push(`/contracts/${record.address}`)}
              >
                Details
              </Button>
            )}
          />
        </Table>
      )}
    </Card>
  );
}
