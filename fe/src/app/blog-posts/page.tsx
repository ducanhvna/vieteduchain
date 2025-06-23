"use client";

import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space, Table, Typography } from "antd";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

// Define Transaction interface based on API response
interface Transaction {
  tx_hash: string;
  height: number;
  timestamp: string;
  status: string;
  gas_used: number;
  gas_wanted: number;
  messages: {
    type: string;
    data: any;
  }[];
}

export default function BlogPostList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Using useTable for compatibility with Refine
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch transactions from API endpoint using correct URL
        const response = await fetch(`http://localhost:1318/api/v1/transactions`);
        if (!response.ok) {
          throw new Error(`Error fetching transactions: ${response.statusText}`);
        }
        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError(err.message || "Failed to fetch transactions");
        // Fallback to empty array if there's an error
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <List>
      <Typography.Title level={3}>Transaction Ledger</Typography.Title>
      {error && <Typography.Text type="danger">{error}</Typography.Text>}
      <Table 
        {...tableProps} 
        rowKey="tx_hash"
        dataSource={transactions}
        loading={loading}
      >
        <Table.Column 
          dataIndex="tx_hash" 
          title="Transaction Hash" 
          render={(value: string) => (
            <Typography.Text ellipsis style={{ maxWidth: 200 }}>
              {value}
            </Typography.Text>
          )}
        />
        <Table.Column dataIndex="height" title="Block Height" />
        <Table.Column dataIndex="timestamp" title="Timestamp" />
        <Table.Column dataIndex="status" title="Status" />
        <Table.Column 
          title="Type" 
          render={(_: any, record: Transaction) => (
            <Typography.Text>
              {record.messages && record.messages.length > 0 
                ? record.messages[0].type 
                : "Unknown"}
            </Typography.Text>
          )}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_: any, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.tx_hash} />
              <EditButton hideText size="small" recordItemId={record.tx_hash} />
              <DeleteButton hideText size="small" recordItemId={record.tx_hash} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}