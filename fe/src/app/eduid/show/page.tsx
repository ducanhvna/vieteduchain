"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NODEINFO_URL } from '@/config';
import { 
  Card, 
  Button, 
  Tabs,
  Space, 
  Typography, 
  message as antdMessage,
  Descriptions,
  Tag,
  Spin,
  Divider
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LinkOutlined } from '@ant-design/icons';

const { Paragraph, Text, Title } = Typography;

export default function ShowDIDPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const did = searchParams.get('did') || '';
  
  const [loading, setLoading] = useState(false);
  const [didDetails, setDidDetails] = useState<any>(null);
  const [didStatus, setDidStatus] = useState<any>(null);
  const [didValidity, setDidValidity] = useState<any>(null);
  const [didLinks, setDidLinks] = useState<any>(null);
  const [didHistory, setDidHistory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (did) {
      fetchDIDDetails();
    }
  }, [did]);

  // Fetch DID details
  const fetchDIDDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}`);
      if (res.ok) {
        const data = await res.json();
        setDidDetails(data);
        
        // After getting details, fetch other related info
        fetchDIDStatus();
        fetchDIDValidity();
        fetchDIDLinks();
        fetchDIDHistory();
      } else {
        antdMessage.error('Không tìm thấy DID!');
        router.push('/eduid');
      }
    } catch (e) {
      antdMessage.error('Lỗi khi truy vấn thông tin DID');
    } finally {
      setLoading(false);
    }
  };

  // Fetch DID status
  const fetchDIDStatus = async () => {
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/status`);
      if (res.ok) {
        const data = await res.json();
        setDidStatus(data);
      }
    } catch (e) {
      console.error('Lỗi khi truy vấn trạng thái DID', e);
    }
  };

  // Fetch DID validity
  const fetchDIDValidity = async () => {
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/validity`);
      if (res.ok) {
        const data = await res.json();
        setDidValidity(data);
      }
    } catch (e) {
      console.error('Lỗi khi truy vấn tính hợp lệ của DID', e);
    }
  };

  // Fetch DID links
  const fetchDIDLinks = async () => {
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/links`);
      if (res.ok) {
        const data = await res.json();
        setDidLinks(data);
      }
    } catch (e) {
      console.error('Lỗi khi truy vấn liên kết DID', e);
    }
  };

  // Fetch DID history
  const fetchDIDHistory = async () => {
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/history`);
      if (res.ok) {
        const data = await res.json();
        setDidHistory(data);
      }
    } catch (e) {
      console.error('Lỗi khi truy vấn lịch sử DID', e);
    }
  };

  // Go to edit page
  const handleEdit = () => {
    router.push(`/eduid/edit?did=${encodeURIComponent(did)}`);
  };

  // Format date string
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Render status tag
  const renderStatusTag = (status: string) => {
    let color = 'default';
    if (status === 'active') color = 'success';
    if (status === 'revoked') color = 'error';
    if (status === 'suspended') color = 'warning';
    if (status === 'expired') color = 'default';
    
    return <Tag color={color}>{status}</Tag>;
  };

  // Render validity tag
  const renderValidityTag = (valid: boolean) => {
    return valid 
      ? <Tag color="success" icon={<CheckCircleOutlined />}>Hợp lệ</Tag>
      : <Tag color="error" icon={<CloseCircleOutlined />}>Không hợp lệ</Tag>;
  };

  if (!did) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Title level={3}>Không tìm thấy DID</Title>
        <Button onClick={() => router.push('/eduid')}>Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={2}>Chi tiết DID</Title>
            <Space>
              <Button onClick={() => router.push('/eduid')}>Quay lại danh sách</Button>
              <Button type="primary" onClick={handleEdit}>Chỉnh sửa</Button>
            </Space>
          </Space>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Đang tải thông tin DID...</div>
            </div>
          ) : (
            <>
              <Descriptions title="Thông tin cơ bản" bordered column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                <Descriptions.Item label="DID">{did}</Descriptions.Item>
                <Descriptions.Item label="Người kiểm soát">{didDetails?.controller}</Descriptions.Item>
                <Descriptions.Item label="Loại thực thể">{didDetails?.entity_type}</Descriptions.Item>
                <Descriptions.Item label="Loại thực thể con">{didDetails?.entity_subtype}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {didStatus ? renderStatusTag(didStatus.status) : 'Đang tải...'}
                </Descriptions.Item>
                <Descriptions.Item label="Tính hợp lệ">
                  {didValidity ? renderValidityTag(didValidity.valid) : 'Đang tải...'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">{didDetails?.created_at ? formatDate(didDetails.created_at) : 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối">{didDetails?.updated_at ? formatDate(didDetails.updated_at) : 'N/A'}</Descriptions.Item>
              </Descriptions>

              <Divider />

              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                items={[
                  {
                    key: 'details',
                    label: 'Chi tiết',
                    children: (
                      <Card type="inner" title="Thông tin đầy đủ">
                        <Paragraph copyable>{JSON.stringify(didDetails, null, 2)}</Paragraph>
                      </Card>
                    )
                  },
                  {
                    key: 'services',
                    label: 'Dịch vụ',
                    children: (
                      <Card type="inner" title="Dịch vụ của DID">
                        {didDetails?.service && didDetails.service.length > 0 ? (
                          didDetails.service.map((service: any, index: number) => (
                            <div key={index} style={{ marginBottom: 16 }}>
                              <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label="ID">{service.id}</Descriptions.Item>
                                <Descriptions.Item label="Loại">{service.type}</Descriptions.Item>
                                <Descriptions.Item label="Endpoint">{service.serviceEndpoint}</Descriptions.Item>
                                {service.description && (
                                  <Descriptions.Item label="Mô tả">{service.description}</Descriptions.Item>
                                )}
                              </Descriptions>
                            </div>
                          ))
                        ) : (
                          <Text>Không có dịch vụ nào được đăng ký cho DID này</Text>
                        )}
                      </Card>
                    )
                  },
                  {
                    key: 'links',
                    label: 'Liên kết',
                    children: (
                      <Card type="inner" title="Liên kết của DID">
                        {didLinks && didLinks.links && didLinks.links.length > 0 ? (
                          didLinks.links.map((link: any, index: number) => (
                            <div key={index} style={{ marginBottom: 16 }}>
                              <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label="DID đích">{link.target_did}</Descriptions.Item>
                                <Descriptions.Item label="Quan hệ">{link.relationship}</Descriptions.Item>
                                <Descriptions.Item label="Ngày tạo">{formatDate(link.created_at)}</Descriptions.Item>
                              </Descriptions>
                            </div>
                          ))
                        ) : (
                          <Text>Không có liên kết nào cho DID này</Text>
                        )}
                      </Card>
                    )
                  },
                  {
                    key: 'history',
                    label: 'Lịch sử',
                    children: (
                      <Card type="inner" title="Lịch sử DID">
                        {didHistory && didHistory.history && didHistory.history.length > 0 ? (
                          didHistory.history.map((event: any, index: number) => (
                            <div key={index} style={{ marginBottom: 16 }}>
                              <Descriptions bordered column={1} size="small">
                                <Descriptions.Item label="Sự kiện">{event.event_type}</Descriptions.Item>
                                <Descriptions.Item label="Thời gian">{formatDate(event.timestamp)}</Descriptions.Item>
                                <Descriptions.Item label="Người thực hiện">{event.actor}</Descriptions.Item>
                                {event.details && (
                                  <Descriptions.Item label="Chi tiết">{JSON.stringify(event.details)}</Descriptions.Item>
                                )}
                              </Descriptions>
                            </div>
                          ))
                        ) : (
                          <Text>Không có dữ liệu lịch sử cho DID này</Text>
                        )}
                      </Card>
                    )
                  },
                ]}
              />
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
