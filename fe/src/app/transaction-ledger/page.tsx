"use client";

import { useEffect, useState } from "react";
import { Table, Card, Typography, Spin, Alert, Tag, Space } from "antd";

// API endpoint: http://localhost:1317/cosmos/tx/v1beta1/txs
// or custom REST: http://localhost:1318/api/v1/transactions

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

export default function TransactionLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError("");
      try {
        // Ưu tiên API custom nếu có, fallback sang Cosmos REST nếu cần
        let response = await fetch("http://localhost:1318/api/v1/transactions");
        let data;
        if (response.ok) {
          data = await response.json();
          // Chuẩn hóa dữ liệu nếu cần
          if (data.transactions) setTransactions(data.transactions);
          else if (data.txs) setTransactions(data.txs);
          else setTransactions([]);
        } else {
          // Fallback Cosmos REST API
          response = await fetch("http://localhost:1317/cosmos/tx/v1beta1/txs?pagination.limit=50&order_by=ORDER_BY_DESC");
          if (!response.ok) throw new Error("Không thể lấy dữ liệu giao dịch từ API Cosmos");
          data = await response.json();
          // Cosmos REST trả về data.txs
          setTransactions(
            (data.txs || []).map((tx: any) => ({
              tx_hash: tx.txhash,
              height: tx.height,
              timestamp: tx.timestamp,
              status: tx.code === 0 ? "success" : "failed",
              gas_used: tx.gas_used,
              gas_wanted: tx.gas_wanted,
              messages: (tx.tx?.body?.messages || []).map((msg: any) => ({
                type: msg["@type"] || "unknown",
                data: msg,
              })),
            }))
          );
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu giao dịch");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <Card style={{ maxWidth: 1200, margin: "32px auto", padding: 24 }}>
      <Typography.Title level={3}>Sổ cái giao dịch (Transaction Ledger)</Typography.Title>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin size="large" />
          <Typography.Text style={{ display: "block", marginTop: 16 }}>
            Đang tải dữ liệu giao dịch...
          </Typography.Text>
        </div>
      ) : (
        <Table
          dataSource={transactions}
          rowKey="tx_hash"
          pagination={{ pageSize: 20 }}
          size="middle"
        >
          <Table.Column
            dataIndex="tx_hash"
            title="Tx Hash"
            render={(value: string) => (
              <Typography.Text copyable ellipsis style={{ maxWidth: 200 }}>
                {value}
              </Typography.Text>
            )}
          />
          <Table.Column dataIndex="height" title="Block" />
          <Table.Column dataIndex="timestamp" title="Thời gian" />
          <Table.Column dataIndex="status" title="Trạng thái" render={(v: string) => (
            <Tag color={v === "success" ? "green" : "red"}>{v}</Tag>
          )} />
          <Table.Column
            title="Loại giao dịch"
            render={(_: any, record: Transaction) => (
              <Space>
                {record.messages && record.messages.length > 0
                  ? record.messages.map((msg, idx) => (
                      <Tag key={idx} color="blue">
                        {msg.type}
                      </Tag>
                    ))
                  : <Tag color="default">Unknown</Tag>}
              </Space>
            )}
          />
        </Table>
      )}
    </Card>
  );
}
