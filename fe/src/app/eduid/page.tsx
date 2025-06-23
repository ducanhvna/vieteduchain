"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL, NODEINFO_URL } from '@/config';
import { 
  Card, 
  Button, 
  Input, 
  Tabs, 
  Table, 
  message as antdMessage, 
  Space, 
  Typography, 
  Select, 
  Form, 
  Pagination, 
  Switch, 
  Tag, 
  Modal, 
  Divider,
  Tooltip
} from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, LinkOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';

const { Paragraph, Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Entity type and subtype options
const ENTITY_TYPES = [
  { value: 'Individual', label: 'Cá nhân' },
  { value: 'Organization', label: 'Tổ chức' },
  { value: 'Credential', label: 'Chứng chỉ' },
  { value: 'DigitalAsset', label: 'Tài sản số' },
  { value: 'Wallet', label: 'Ví' },
  { value: 'Service', label: 'Dịch vụ' }
];

const ENTITY_SUBTYPES = {
  Individual: [
    { value: 'Student', label: 'Sinh viên' },
    { value: 'Lecturer', label: 'Giảng viên' },
    { value: 'Staff', label: 'Nhân viên' }
  ],
  Organization: [
    { value: 'University', label: 'Trường đại học' },
    { value: 'Department', label: 'Khoa/Phòng ban' },
    { value: 'Enterprise', label: 'Doanh nghiệp' }
  ],
  Credential: [
    { value: 'Degree', label: 'Bằng cấp' },
    { value: 'Certificate', label: 'Chứng chỉ' },
    { value: 'Transcript', label: 'Bảng điểm' },
    { value: 'ResearchPaper', label: 'Bài nghiên cứu' }
  ],
  DigitalAsset: [
    { value: 'CourseContent', label: 'Nội dung khóa học' },
    { value: 'DigitalSeat', label: 'Ghế số' }
  ],
  Service: [
    { value: 'API', label: 'API' },
    { value: 'Bridge', label: 'Cầu nối' },
    { value: 'Oracle', label: 'Oracle' }
  ]
};

// Relationship types for linking DIDs
const RELATIONSHIP_TYPES = [
  { value: 'enrolled_at', label: 'Đăng ký tại' },
  { value: 'employed_by', label: 'Làm việc tại' },
  { value: 'owns', label: 'Sở hữu' },
  { value: 'issued_by', label: 'Được cấp bởi' },
  { value: 'issued_to', label: 'Cấp cho' },
  { value: 'created_by', label: 'Tạo bởi' },
  { value: 'provides', label: 'Cung cấp' },
  { value: 'has_department', label: 'Có phòng ban' },
  { value: 'belongs_to', label: 'Thuộc về' }
];

export default function Page() {
  const router = useRouter();
  // Basic state
  const [did, setDid] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [serviceEndpoint, setServiceEndpoint] = useState('');
  const [result, setResult] = useState<any>(null);
  const [hash, setHash] = useState('');
  const [mode, setMode] = useState<string>('list');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  
  // Advanced state for all required operations
  const [entityType, setEntityType] = useState('Individual');
  const [entitySubtype, setEntitySubtype] = useState('Student');
  const [controller, setController] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [newController, setNewController] = useState('');
  const [sourceDid, setSourceDid] = useState('');
  const [targetDid, setTargetDid] = useState('');
  const [relationship, setRelationship] = useState('enrolled_at');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [didStatus, setDidStatus] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [credential, setCredential] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<any>(null);

  // Account options for controller selection
  const [accountOptions, setAccountOptions] = useState<any[]>([]);

  // Reset result and message when changing tabs
  useEffect(() => {
    setResult(null);
    setMessage('');
    setVerificationResult(null);
  }, [mode]);

  // Get available entity subtypes based on selected entity type
  const getSubtypes = () => {
    return ENTITY_SUBTYPES[entityType as keyof typeof ENTITY_SUBTYPES] || [];
  };

  // Helper function to show success message
  const showSuccess = (msg: string) => {
    setMessage(msg);
    antdMessage.success(msg);
  };

  // Helper function to show error message
  const showError = (msg: string, error?: any) => {
    const errorMsg = error?.detail || error?.message || msg;
    setMessage(errorMsg);
    antdMessage.error(errorMsg);
  };

  // Modal helper functions
  const showModal = (title: string, content: any) => {
    setModalTitle(title);
    setModalContent(content);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  // Fetch real user accounts from Cosmos API
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`${NODEINFO_URL}/api/v1/did/real-users`);
        if (res.ok) {
          const data = await res.json();
          // Không cần lọc @type nữa, chỉ cần có pub_key là user thực sự
          const users = (data.real_users || []).filter((acc: any) => acc.pub_key);
          setAccountOptions(users);
        }
      } catch (e) {
        // Không cần báo lỗi nếu không lấy được
      }
    };
    fetchAccounts();
  }, []);

  // 1. Register DID
  const handleRegister = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method: "eduid",
          controller: controller || "wasm1mc3mcx76jlm89heen26dqves0qunknkf8zguwc",
          entity_type: entityType,
          entity_subtype: entitySubtype,
          public_key: publicKey,
          services: serviceEndpoint ? [{
            id: `${did}#service-1`,
            type: "DIDCommMessaging",
            serviceEndpoint: serviceEndpoint
          }] : undefined
        })
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.status === 201) {
        showSuccess('Đăng ký DID thành công!');
        // After successful registration, update the DID field with the created DID
        if (data.id) {
          setDid(data.id);
        }
      } else {
        showError('Lỗi đăng ký DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API đăng ký DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Update DID
  const handleUpdate = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          did: did,
          controller: controller || undefined,
          add_service: serviceEndpoint ? [{
            id: `${did}#service-${Date.now()}`,
            type: serviceType || "DIDCommMessaging",
            serviceEndpoint: serviceEndpoint,
            description: serviceName || undefined
          }] : undefined
        })
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Cập nhật DID thành công!');
      } else {
        showError('Lỗi cập nhật DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API cập nhật DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Add Service to DID
  const handleAddService = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: serviceId || `${did}#service-${Date.now()}`,
          type: serviceType || "DIDCommMessaging",
          serviceEndpoint: serviceEndpoint,
          description: serviceName
        })
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Thêm dịch vụ cho DID thành công!');
      } else {
        showError('Lỗi thêm dịch vụ cho DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API thêm dịch vụ', e);
    } finally {
      setLoading(false);
    }
  };

  // 4. Remove Service from DID
  const handleRemoveService = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      if (!serviceId) {
        showError('ID dịch vụ không được để trống');
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/service/${encodeURIComponent(serviceId)}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Xóa dịch vụ của DID thành công!');
      } else {
        showError('Lỗi xóa dịch vụ của DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API xóa dịch vụ', e);
    } finally {
      setLoading(false);
    }
  };

  // 5. Query DID details
  const handleQuery = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}`);
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Truy vấn DID thành công!');
      } else {
        showError('Không tìm thấy DID!', data);
      }
    } catch (e) {
      showError('Lỗi khi truy vấn DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 6. Check DID validity
  const handleCheckValidity = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/validity`);
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Kiểm tra tính hợp lệ của DID thành công!');
      } else {
        showError('Lỗi kiểm tra tính hợp lệ của DID', data);
      }
    } catch (e) {
      showError('Lỗi khi kiểm tra tính hợp lệ của DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 7. Check DID status
  const handleCheckStatus = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/status`);
      const data = await res.json();
      setResult(data);
      setDidStatus(data.status);
      
      if (res.ok) {
        showSuccess('Kiểm tra trạng thái của DID thành công!');
      } else {
        showError('Lỗi kiểm tra trạng thái của DID', data);
      }
    } catch (e) {
      showError('Lỗi khi kiểm tra trạng thái của DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 8. List DIDs with pagination and filters
  const handleList = async () => {
    setMessage('');
    setList([]);
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      if (controller) params.append('controller', controller);
      if (entityType) params.append('entity_type', entityType);
      if (entitySubtype) params.append('entity_subtype', entitySubtype);
      if (didStatus) params.append('status', didStatus);
      
      const res = await fetch(`${NODEINFO_URL}/api/v1/did?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setList(data.items || []);
        setTotal(data.total || 0);
        showSuccess(`Lấy danh sách DID thành công! Tổng số: ${data.total || 0}`);
      } else {
        showError('Không lấy được danh sách DID', data);
      }
    } catch (e) {
      showError('Lỗi kết nối backend', e);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    // Trigger list refresh
    setTimeout(() => {
      handleList();
    }, 100);
  };

  // 9. Link DIDs
  const handleLinkDids = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_did: sourceDid,
          target_did: targetDid,
          relationship: relationship
        })
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Liên kết DID thành công!');
      } else {
        showError('Lỗi liên kết DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API liên kết DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 10. Query DID links
  const handleQueryLinks = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/links`);
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Truy vấn liên kết DID thành công!');
      } else {
        showError('Lỗi truy vấn liên kết DID', data);
      }
    } catch (e) {
      showError('Lỗi khi truy vấn liên kết DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 11. Transfer DID ownership
  const handleTransferDid = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          did: did,
          new_controller: newController,
          new_public_key: publicKey || undefined
        })
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Chuyển quyền sở hữu DID thành công!');
      } else {
        showError('Lỗi chuyển quyền sở hữu DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API chuyển quyền sở hữu DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 12. Revoke DID
  const handleRevokeDid = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          did: did,
          reason: revokeReason
        })
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Thu hồi DID thành công!');
      } else {
        showError('Lỗi thu hồi DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API thu hồi DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 13. Check hash integrity
  const handleCheckIntegrity = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/integrity`);
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Kiểm tra tính toàn vẹn dữ liệu DID thành công!');
      } else {
        showError('Lỗi kiểm tra tính toàn vẹn dữ liệu DID', data);
      }
    } catch (e) {
      showError('Lỗi khi kiểm tra tính toàn vẹn dữ liệu DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 14. Query DID history/metadata
  const handleQueryHistory = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/history`);
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Truy vấn lịch sử DID thành công!');
      } else {
        showError('Lỗi truy vấn lịch sử DID', data);
      }
    } catch (e) {
      showError('Lỗi khi truy vấn lịch sử DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 15. Create EduCert for DID
  const handleCreateEduCert = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/educert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credential_data: JSON.parse(credential || '{}')
        })
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Tạo EduCert cho DID thành công!');
      } else {
        showError('Lỗi tạo EduCert cho DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API tạo EduCert', e);
    } finally {
      setLoading(false);
    }
  };

  // 16. Get EduCert for DID
  const handleGetEduCert = async () => {
    setMessage('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/educert`);
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        showSuccess('Lấy EduCert của DID thành công!');
      } else {
        showError('Lỗi lấy EduCert của DID', data);
      }
    } catch (e) {
      showError('Lỗi khi lấy EduCert của DID', e);
    } finally {
      setLoading(false);
    }
  };

  // 17. Verify EduCert for DID
  const handleVerifyEduCert = async () => {
    setMessage('');
    setVerificationResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/did/${encodeURIComponent(did)}/educert/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credential: result || JSON.parse(credential || '{}')
        })
      });
      
      const data = await res.json();
      setVerificationResult(data);
      
      if (res.ok) {
        showSuccess('Xác thực EduCert của DID thành công!');
      } else {
        showError('Lỗi xác thực EduCert của DID', data);
      }
    } catch (e) {
      showError('Lỗi khi xác thực EduCert của DID', e);
    } finally {
      setLoading(false);
    }
  };

  // Render results
  const renderResult = () => {
    if (!result) return null;
    
    return (
      <Card type="inner" title="Kết quả" style={{ marginTop: 16 }}>
        <Paragraph copyable>{JSON.stringify(result, null, 2)}</Paragraph>
      </Card>
    );
  };

  // Render verification result
  const renderVerificationResult = () => {
    if (!verificationResult) return null;
    
    const isValid = verificationResult.valid === true;
    
    return (
      <Card 
        type="inner" 
        title="Kết quả xác thực" 
        style={{ marginTop: 16 }}
        extra={
          isValid 
            ? <Tag color="success" icon={<CheckCircleOutlined />}>Hợp lệ</Tag>
            : <Tag color="error" icon={<CloseCircleOutlined />}>Không hợp lệ</Tag>
        }
      >
        <Paragraph>
          <Text strong>Trạng thái: </Text>
          {isValid ? 'Hợp lệ' : 'Không hợp lệ'}
        </Paragraph>
        {verificationResult.reason && (
          <Paragraph>
            <Text strong>Lý do: </Text>
            {verificationResult.reason}
          </Paragraph>
        )}
        <Paragraph copyable>{JSON.stringify(verificationResult, null, 2)}</Paragraph>
      </Card>
    );
  };

  // View a specific DID's details when clicked in the list
  const viewDidDetails = (did: string) => {
    setDid(did);
    setMode('query');
    setTimeout(() => {
      handleQuery();
    }, 100);
  };

  // --- RETURN JSX STARTS HERE ---
  return (
    <div style={{ padding: '20px' }}>
      <Card style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2}>Quản lý Danh tính tự chủ (EduID)</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => router.push('/eduid/create')}
          >
            Tạo DID mới
          </Button>
        </Space>
        <Tabs
          activeKey={mode}
          onChange={key => setMode(key)}
          items={[
            {
              key: 'register',
              label: 'Đăng ký DID',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="Loại thực thể">
                      <Select
                        value={entityType}
                        onChange={(value: string) => {
                          setEntityType(value);
                          // Reset subtype when type changes
                          setEntitySubtype('');
                        }}
                        style={{ width: '100%' }}
                      >
                        {ENTITY_TYPES.map(type => (
                          <Option key={type.value} value={type.value}>{type.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="Loại thực thể con">
                      <Select
                        value={entitySubtype}
                        onChange={(value: string) => setEntitySubtype(value)}
                        style={{ width: '100%' }}
                      >
                        {getSubtypes().map(subtype => (
                          <Option key={subtype.value} value={subtype.value}>{subtype.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="Người kiểm soát">
                      <Select
                        showSearch
                        placeholder="Chọn người kiểm soát từ danh sách account trên node"
                        value={controller}
                        onChange={(value, option) => {
                          setController(value);
                          // Tìm pub_key tương ứng
                          const acc = accountOptions.find((acc: any) => acc.address === value);
                          if (acc && acc.pub_key && acc.pub_key.key) {
                            setPublicKey(acc.pub_key.key);
                          }
                        }}
                        filterOption={(input, option) => {
                          const label = option?.children?.toString() || '';
                          return label.toLowerCase().includes(input.toLowerCase());
                        }}
                        style={{ width: '100%' }}
                        optionLabelProp="children"
                      >
                        {accountOptions.map((acc: any) => (
                          <Option key={acc.address} value={acc.address}>
                            {acc.address}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="Khóa công khai">
                      <Input 
                        placeholder="Khóa công khai (Public Key)" 
                        value={publicKey} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPublicKey(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="Endpoint dịch vụ (tùy chọn)">
                      <Input 
                        placeholder="Endpoint dịch vụ" 
                        value={serviceEndpoint} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceEndpoint(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Button 
                      type="primary" 
                      onClick={handleRegister} 
                      loading={loading}
                      disabled={!publicKey}
                    >
                      Đăng ký DID
                    </Button>
                  </Form>
                  {renderResult()}
                </Space>
              ),
            },
            {
              key: 'update',
              label: 'Cập nhật DID',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="DID" required>
                      <Input 
                        placeholder="DID cần cập nhật" 
                        value={did} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="Người kiểm soát mới (tùy chọn)">
                      <Input 
                        placeholder="Địa chỉ người kiểm soát mới" 
                        value={controller} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setController(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="Khóa công khai mới (tùy chọn)">
                      <Input 
                        placeholder="Khóa công khai mới" 
                        value={publicKey} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPublicKey(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Button 
                      type="primary" 
                      onClick={handleUpdate} 
                      loading={loading}
                      disabled={!did}
                    >
                      Cập nhật DID
                    </Button>
                  </Form>
                  {renderResult()}
                </Space>
              ),
            },
            {
              key: 'service',
              label: 'Dịch vụ DID',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="DID" required>
                      <Input 
                        placeholder="DID cần thêm/xóa dịch vụ" 
                        value={did} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Divider>Thông tin dịch vụ</Divider>
                    
                    <Form.Item label="ID dịch vụ">
                      <Input 
                        placeholder="ID dịch vụ"
                        value={serviceId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceId(e.target.value)}
                        disabled={!did}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button 
                          type="primary" 
                          onClick={handleAddService} 
                          loading={loading}
                          disabled={!did || !serviceEndpoint}
                        >
                          Thêm dịch vụ
                        </Button>
                        <Button 
                          danger
                          onClick={handleRemoveService} 
                          loading={loading}
                          disabled={!did || !serviceId}
                        >
                          Xóa dịch vụ
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                  {renderResult()}
                </Space>
              ),
            },
            {
              key: 'query',
              label: 'Tra cứu DID',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="DID" required>
                      <Input 
                        placeholder="DID cần tra cứu" 
                        value={did} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Space>
                      <Button 
                        type="primary" 
                        onClick={handleQuery} 
                        loading={loading}
                        disabled={!did}
                      >
                        Tra cứu chi tiết
                      </Button>
                      
                      <Button 
                        onClick={handleCheckValidity} 
                        loading={loading}
                        disabled={!did}
                      >
                        Kiểm tra hợp lệ
                      </Button>
                      
                      <Button 
                        onClick={handleCheckStatus} 
                        loading={loading}
                        disabled={!did}
                      >
                        Kiểm tra trạng thái
                      </Button>
                    </Space>
                  </Form>
                  {renderResult()}
                </Space>
              ),
            },
            {
              key: 'list',
              label: 'Liệt kê DIDs',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Space wrap>
                      <Form.Item label="Người kiểm soát">
                        <Input 
                          placeholder="Địa chỉ người kiểm soát" 
                          value={controller} 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setController(e.target.value)} 
                          style={{ width: 200 }}
                        />
                      </Form.Item>
                      
                      <Form.Item label="Loại thực thể">
                        <Select
                          value={entityType}
                          onChange={(value: string) => setEntityType(value)}
                          style={{ width: 150 }}
                          allowClear
                        >
                          {ENTITY_TYPES.map(type => (
                            <Option key={type.value} value={type.value}>{type.label}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item label="Loại thực thể con">
                        <Select
                          value={entitySubtype}
                          onChange={(value: string) => setEntitySubtype(value)}
                          style={{ width: 150 }}
                          allowClear
                        >
                          {getSubtypes().map(subtype => (
                            <Option key={subtype.value} value={subtype.value}>{subtype.label}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item label="Trạng thái">
                        <Select
                          value={didStatus}
                          onChange={(value: string) => setDidStatus(value)}
                          style={{ width: 120 }}
                          allowClear
                        >
                          <Option value="active">Đang hoạt động</Option>
                          <Option value="revoked">Đã thu hồi</Option>
                          <Option value="suspended">Tạm ngưng</Option>
                          <Option value="expired">Hết hạn</Option>
                        </Select>
                      </Form.Item>
                    </Space>
                    
                    <Button 
                      type="primary" 
                      onClick={handleList} 
                      loading={loading}
                      icon={<ReloadOutlined />}
                    >
                      Lấy danh sách DID
                    </Button>
                  </Form>
                  
                  {list.length > 0 && (
                    <>
                      <Table
                        dataSource={list}
                        columns={[
                          { 
                            title: 'DID', 
                            dataIndex: 'id', 
                            key: 'id',
                            render: (text: string) => (
                              <Button type="link" onClick={() => router.push(`/eduid/show?did=${encodeURIComponent(text)}`)}>
                                {text}
                              </Button>
                            )
                          },
                          { 
                            title: 'Người kiểm soát', 
                            dataIndex: 'controller', 
                            key: 'controller',
                            ellipsis: true
                          },
                          { 
                            title: 'Loại', 
                            dataIndex: 'entity_type', 
                            key: 'entity_type' 
                          },
                          { 
                            title: 'Loại con', 
                            dataIndex: 'entity_subtype', 
                            key: 'entity_subtype' 
                          },
                          { 
                            title: 'Trạng thái', 
                            dataIndex: 'status', 
                            key: 'status',
                            render: (status: string) => {
                              let color = 'default';
                              if (status === 'active') color = 'success';
                              if (status === 'revoked') color = 'error';
                              if (status === 'suspended') color = 'warning';
                              if (status === 'expired') color = 'default';
                              
                              return <Tag color={color}>{status}</Tag>;
                            }
                          },
                          {
                            title: 'Hành động',
                            key: 'action',
                            render: (_: any, record: any) => (
                              <Space size="small">
                                <Button 
                                  type="text" 
                                  icon={<EditOutlined />} 
                                  onClick={() => router.push(`/eduid/edit?did=${encodeURIComponent(record.id)}`)}
                                />
                              </Space>
                            ),
                          },
                        ]}
                        rowKey="id"
                        style={{ marginTop: 16 }}
                        pagination={false}
                      />
                      
                      <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        onChange={handlePageChange}
                        showSizeChanger
                        style={{ marginTop: 16, textAlign: 'right' }}
                      />
                    </>
                  )}
                </Space>
              ),
            },
            {
              key: 'link',
              label: 'Liên kết DIDs',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="DID nguồn" required>
                      <Input 
                        placeholder="DID nguồn" 
                        value={sourceDid} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="DID đích" required>
                      <Input 
                        placeholder="DID đích" 
                        value={targetDid} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="Quan hệ" required>
                      <Select
                        value={relationship}
                        onChange={(value: string) => setRelationship(value)}
                        style={{ width: '100%' }}
                      >
                        {RELATIONSHIP_TYPES.map(type => (
                          <Option key={type.value} value={type.value}>{type.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Space>
                      <Button 
                        type="primary" 
                        onClick={handleLinkDids} 
                        loading={loading}
                        disabled={!sourceDid || !targetDid}
                        icon={<LinkOutlined />}
                      >
                        Liên kết DIDs
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          setDid(sourceDid);
                          handleQueryLinks();
                        }} 
                        loading={loading}
                        disabled={!sourceDid}
                      >
                        Tra cứu liên kết
                      </Button>
                    </Space>
                  </Form>
                  {renderResult()}
                </Space>
              ),
            },
            {
              key: 'transfer',
              label: 'Chuyển quyền DID',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="DID" required>
                      <Input 
                        placeholder="DID cần chuyển quyền" 
                        value={did} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="Người kiểm soát mới" required>
                      <Input 
                        placeholder="Địa chỉ người kiểm soát mới" 
                        value={newController} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewController(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="Khóa công khai mới (tùy chọn)">
                      <Input 
                        placeholder="Khóa công khai mới" 
                        value={publicKey} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPublicKey(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Button 
                      type="primary" 
                      onClick={handleTransferDid} 
                      loading={loading}
                      disabled={!did || !newController}
                    >
                      Chuyển quyền sở hữu
                    </Button>
                  </Form>
                  {renderResult()}
                </Space>
              ),
            },
            {
              key: 'revoke',
              label: 'Thu hồi DID',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="DID" required>
                      <Input 
                        placeholder="DID cần thu hồi" 
                        value={did} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="Lý do thu hồi (tùy chọn)">
                      <TextArea 
                        placeholder="Lý do thu hồi DID" 
                        value={revokeReason} 
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRevokeReason(e.target.value)} 
                        rows={3}
                      />
                    </Form.Item>
                    
                    <Button 
                      type="primary" 
                      danger
                      onClick={handleRevokeDid} 
                      loading={loading}
                      disabled={!did}
                    >
                      Thu hồi DID
                    </Button>
                  </Form>
                  {renderResult()}
                </Space>
              ),
            },
            {
              key: 'advanced',
              label: 'Nâng cao',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="DID" required>
                      <Input 
                        placeholder="DID" 
                        value={did} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Space wrap>
                      <Button 
                        onClick={handleCheckIntegrity} 
                        loading={loading}
                        disabled={!did}
                      >
                        Kiểm tra tính toàn vẹn
                      </Button>
                      
                      <Button 
                        onClick={handleQueryHistory} 
                        loading={loading}
                        disabled={!did}
                      >
                        Xem lịch sử
                      </Button>
                      
                      <Button 
                        onClick={handleQueryLinks} 
                        loading={loading}
                        disabled={!did}
                      >
                        Xem liên kết
                      </Button>
                    </Space>
                  </Form>
                  {renderResult()}
                </Space>
              ),
            },
            {
              key: 'educert',
              label: 'EduCert',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form layout="vertical">
                    <Form.Item label="DID" required>
                      <Input 
                        placeholder="DID" 
                        value={did} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDid(e.target.value)} 
                      />
                    </Form.Item>
                    
                    <Form.Item label="Dữ liệu chứng chỉ (JSON)">
                      <TextArea 
                        placeholder='Dữ liệu chứng chỉ theo định dạng JSON. Ví dụ: {"type": "BachelorDegree", "name": "Nguyễn Văn A", "degree": "Công nghệ thông tin"}' 
                        value={credential} 
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCredential(e.target.value)} 
                        rows={5}
                      />
                    </Form.Item>
                    
                    <Space wrap>
                      <Button 
                        type="primary" 
                        onClick={handleCreateEduCert} 
                        loading={loading}
                        disabled={!did || !credential}
                      >
                        Tạo chứng chỉ
                      </Button>
                      
                      <Button 
                        onClick={handleGetEduCert} 
                        loading={loading}
                        disabled={!did}
                      >
                        Lấy chứng chỉ
                      </Button>
                      
                      <Button 
                        onClick={handleVerifyEduCert} 
                        loading={loading}
                        disabled={!did}
                      >
                        Xác thực chứng chỉ
                      </Button>
                    </Space>
                  </Form>
                  {renderResult()}
                  {renderVerificationResult()}
                </Space>
              ),
            },
          ]}
        />
        {message && <p style={{marginTop:16}}>{message}</p>}

        {/* Modal for showing DID details */}
        <Modal
          title={modalTitle}
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="close" onClick={handleModalClose}>
              Đóng
            </Button>
          ]}
          width={800}
        >
          <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(modalContent, null, 2)}</pre>
        </Modal>
      </Card>
    </div>
  );
}
