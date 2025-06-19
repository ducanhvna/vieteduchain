"use client";

import { useState } from 'react';
import { Input, Button, Tabs, message as antdMessage, Card, Descriptions, Switch } from 'antd';
import { API_BASE_URL } from '@/config';

export default function Page() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<number|null>(null);
  const [mintAmount, setMintAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [escrowId, setEscrowId] = useState('');
  const [escrowAmount, setEscrowAmount] = useState('');
  const [escrowSchool, setEscrowSchool] = useState('');
  const [escrowInfo, setEscrowInfo] = useState<any>(null);
  const [releaseEscrowId, setReleaseEscrowId] = useState('');
  const [proof, setProof] = useState(false);
  const [price, setPrice] = useState<number|null>(null);
  const [tab, setTab] = useState<'balance'|'mint'|'transfer'|'escrow'|'release'|'price'>('balance');
  const [enrollmentId, setEnrollmentId] = useState('');

  const showMsg = (msg: string, type: 'success'|'error' = 'error') => {
    if (type === 'success') antdMessage.success(msg);
    else antdMessage.error(msg);
  };

  const handleGetBalance = async () => {
    setBalance(null);
    try {
      const res = await fetch(`${API_BASE_URL}/cosmos/bank/v1beta1/balances/${encodeURIComponent(address)}`);
      const data = await res.json();
      const evndBalance = data.balances.find((b: any) => b.denom === 'evnd') || { amount: '0' };
      setBalance(parseInt(evndBalance.amount) / 1000000); // Assuming 6 decimals
      showMsg('Lấy số dư thành công!', 'success');
    } catch {
      showMsg('Lỗi khi truy vấn số dư');
    }
  };

  const handleMint = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/edu-pay/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_req: {
            from: "admin_address",
            chain_id: "educhain-1"
          },
          to_address: address, 
          amount: [
            {
              denom: "evnd",
              amount: (parseFloat(mintAmount) * 1000000).toString() // Convert to atomic units
            }
          ]
        })
      });
      const data = await res.json();
      if (data.txhash) {
        showMsg('Mint thành công!', 'success');
        handleGetBalance(); // Refresh balance
      } else {
        showMsg(data.detail || 'Lỗi mint', 'error');
      }
    } catch {
      showMsg('Lỗi khi mint eVND');
    }
  };

  const handleTransfer = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cosmos/bank/v1beta1/msgSend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_req: {
            from: address,
            chain_id: "educhain-1"
          },
          amount: [
            {
              denom: "evnd",
              amount: (parseFloat(transferAmount) * 1000000).toString() // Convert to atomic units
            }
          ],
          to_address: transferTo
        })
      });
      const data = await res.json();
      if (data.txhash) {
        showMsg('Chuyển tiền thành công!', 'success');
      } else {
        showMsg(data.detail || 'Lỗi chuyển tiền', 'error');
      }
    } catch {
      showMsg('Lỗi khi chuyển eVND');
    }
  };

  const handleCreateEscrow = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/edu-pay/create-escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_req: {
            from: address,
            chain_id: "educhain-1"
          },
          recipient: escrowSchool,
          amount: [
            {
              denom: "evnd",
              amount: (parseFloat(escrowAmount) * 1000000).toString() // Convert to atomic units
            }
          ],
          enrollment_id: enrollmentId || escrowId
        })
      });
      const data = await res.json();
      if (data.escrow_id) {
        setEscrowId(data.escrow_id);
        showMsg('Tạo escrow thành công!', 'success');
        handleGetEscrow(); // Get new escrow info
      } else {
        showMsg(data.detail || 'Lỗi tạo escrow', 'error');
      }
    } catch {
      showMsg('Lỗi khi tạo escrow');
    }
  };

  const handleReleaseEscrow = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/edu-pay/release/${encodeURIComponent(releaseEscrowId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_req: {
            from: "authorized_address",
            chain_id: "educhain-1"
          }
        })
      });
      const data = await res.json();
      if (data.txhash) {
        showMsg('Release escrow thành công!', 'success');
        // Get updated escrow info
        const escrowRes = await fetch(`${API_BASE_URL}/edu-pay/escrow/${encodeURIComponent(releaseEscrowId)}`);
        const escrowData = await escrowRes.json();
        setEscrowInfo(escrowData);
      } else {
        showMsg(data.detail || 'Lỗi release escrow', 'error');
      }
    } catch {
      showMsg('Lỗi khi release escrow');
    }
  };

  const handleGetEscrow = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/edu-pay/escrow/${encodeURIComponent(escrowId)}`);
      const data = await res.json();
      if (data.escrow_id) {
        setEscrowInfo(data);
        showMsg('Lấy thông tin escrow thành công!', 'success');
      } else {
        showMsg(data.detail || 'Không tìm thấy escrow', 'error');
      }
    } catch {
      showMsg('Lỗi khi truy vấn escrow');
    }
  };

  const handleGetPrice = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/edupay/price`);
      const data = await res.json();
      setPrice(data.vnd_usdc);
      showMsg('Lấy giá oracle thành công!', 'success');
    } catch {
      showMsg('Lỗi khi lấy giá oracle');
    }
  };

  return (
    <Card style={{ maxWidth: 600, margin: '32px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Thanh toán học phí & học bổng (EduPay)</h2>
      <Tabs
        activeKey={tab}
        onChange={key => setTab(key as typeof tab)}
        items={[
          {
            key: 'balance',
            label: 'Tra cứu số dư',
            children: (
              <div>
                <Input
                  placeholder="Địa chỉ ví (address)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: 320, marginRight: 8 }}
                />
                <Button type="primary" onClick={handleGetBalance}>Tra cứu</Button>
                {balance !== null && (
                  <div style={{ marginTop: 16 }}>
                    <b>Số dư:</b> {balance} eVND
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'mint',
            label: 'Mint eVND',
            children: (
              <div>
                <Input
                  placeholder="Địa chỉ ví (address)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: 320, marginRight: 8 }}
                />
                <Input
                  placeholder="Số lượng eVND"
                  value={mintAmount}
                  onChange={e => setMintAmount(e.target.value)}
                  style={{ width: 180, marginRight: 8, marginTop: 8 }}
                />
                <Button type="primary" onClick={handleMint} style={{ marginTop: 8 }}>Mint</Button>
              </div>
            ),
          },
          {
            key: 'transfer',
            label: 'Chuyển eVND',
            children: (
              <div>
                <Input
                  placeholder="Từ địa chỉ (address)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: 320, marginRight: 8 }}
                />
                <Input
                  placeholder="Đến địa chỉ (address)"
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  style={{ width: 320, marginRight: 8, marginTop: 8 }}
                />
                <Input
                  placeholder="Số lượng eVND"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  style={{ width: 180, marginRight: 8, marginTop: 8 }}
                />
                <Button type="primary" onClick={handleTransfer} style={{ marginTop: 8 }}>Chuyển</Button>
              </div>
            ),
          },
          {
            key: 'escrow',
            label: 'Tạo Escrow',
            children: (
              <div>
                <Input
                  placeholder="Escrow ID"
                  value={escrowId}
                  onChange={e => setEscrowId(e.target.value)}
                  style={{ width: 200, marginRight: 8 }}
                />
                <Input
                  placeholder="Địa chỉ ví (payer)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: 320, marginRight: 8, marginTop: 8 }}
                />
                <Input
                  placeholder="Trường (school)"
                  value={escrowSchool}
                  onChange={e => setEscrowSchool(e.target.value)}
                  style={{ width: 220, marginRight: 8, marginTop: 8 }}
                />
                <Input
                  placeholder="Số lượng eVND"
                  value={escrowAmount}
                  onChange={e => setEscrowAmount(e.target.value)}
                  style={{ width: 180, marginRight: 8, marginTop: 8 }}
                />
                <Button type="primary" onClick={handleCreateEscrow} style={{ marginTop: 8 }}>Tạo Escrow</Button>
                <Button onClick={handleGetEscrow} style={{ marginLeft: 8, marginTop: 8 }}>Xem Escrow</Button>
                {escrowInfo && (
                  <Descriptions bordered column={1} style={{ marginTop: 16 }}>
                    {Object.entries(escrowInfo).map(([k, v]) => (
                      <Descriptions.Item key={k} label={k}>{String(v)}</Descriptions.Item>
                    ))}
                  </Descriptions>
                )}
              </div>
            ),
          },
          {
            key: 'release',
            label: 'Release Escrow',
            children: (
              <div>
                <Input
                  placeholder="Escrow ID"
                  value={releaseEscrowId}
                  onChange={e => setReleaseEscrowId(e.target.value)}
                  style={{ width: 200, marginRight: 8 }}
                />
                <span style={{ marginRight: 8 }}>Proof of Enrollment:</span>
                <Switch checked={proof} onChange={setProof} />
                <Button type="primary" onClick={handleReleaseEscrow} style={{ marginLeft: 8 }}>Release</Button>
              </div>
            ),
          },
          {
            key: 'price',
            label: 'Giá Oracle',
            children: (
              <div>
                <Button onClick={handleGetPrice}>Lấy giá VND/USDC</Button>
                {price !== null && (
                  <div style={{ marginTop: 16 }}>
                    <b>1 USDC =</b> {price} VND
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
