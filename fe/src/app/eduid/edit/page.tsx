"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NODEINFO_URL } from '@/config';
import { 
  Card, 
  Button, 
  Input, 
  Tabs,
  Space, 
  Typography, 
  Form,
  Select,
  Divider,
  message as antdMessage,
  Modal,
  Spin,
  InputNumber
} from 'antd';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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

export default function EditDIDPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const did = searchParams.get('did') || '';
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [didDetails, setDidDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('update');
  
  // Form states
  const [controller, setController] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceEndpoint, setServiceEndpoint] = useState('');
  const [newController, setNewController] = useState('');
  const [targetDid, setTargetDid] = useState('');
  const [relationship, setRelationship] = useState('enrolled_at');
  const [revokeReason, setRevokeReason] = useState('');
  const [credential, setCredential] = useState('');
  
  // Modal states
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState<string>('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalContent, setConfirmModalContent] = useState('');

  useEffect(() => {
    if (did) {
      fetchDIDDetails();
    } else {
      setInitialLoading(false);
      antdMessage.error('Không tìm thấy DID để chỉnh sửa');
      router.push('/eduid');
    }
  }, [did]);

  // Fetch DID details
  const fetchDIDDetails = async () => {
    setInitialLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}`);
      if (res.ok) {
        const data = await res.json();
        setDidDetails(data);
        
        // Populate form fields with current values
        if (data.controller) setController(data.controller);
        if (data.public_key) setPublicKey(data.public_key);
      } else {
        antdMessage.error('Không tìm thấy DID!');
        router.push('/eduid');
      }
    } catch (e) {
      antdMessage.error('Lỗi khi truy vấn thông tin DID');
      router.push('/eduid');
    } finally {
      setInitialLoading(false);
    }
  };

  // Helper function to show success message
  const showSuccess = (msg: string) => {
    antdMessage.success(msg);
  };

  // Helper function to show error message
  const showError = (msg: string, error?: any) => {
    const errorMsg = error?.detail || error?.message || msg;
    antdMessage.error(errorMsg);
  };

  // Show confirmation modal
  const showConfirmModal = (action: string, title: string, content: string) => {
    setConfirmModalAction(action);
    setConfirmModalTitle(title);
    setConfirmModalContent(content);
    setIsConfirmModalVisible(true);
  };

  // Handle confirmation
  const handleConfirm = () => {
    setIsConfirmModalVisible(false);
    
    switch (confirmModalAction) {
      case 'revoke':
        handleRevokeDid();
        break;
      case 'transfer':
        handleTransferDid();
        break;
      default:
        break;
    }
  };

  // Update DID
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          did: did,
          controller: controller || undefined,
          public_key: publicKey || undefined
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showSuccess('Cập nhật DID thành công!');
        // Refresh the details
        fetchDIDDetails();
      } else {
        showError('Lỗi cập nhật DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API cập nhật DID', e);
    } finally {
      setLoading(false);
    }
  };

  // Add Service to DID
  const handleAddService = async () => {
    if (!serviceEndpoint) {
      showError('Endpoint dịch vụ không được để trống');
      return;
    }
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
      
      if (res.ok) {
        showSuccess('Thêm dịch vụ cho DID thành công!');
        // Clear form fields
        setServiceId('');
        setServiceType('');
        setServiceName('');
        setServiceEndpoint('');
        // Refresh the details
        fetchDIDDetails();
      } else {
        showError('Lỗi thêm dịch vụ cho DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API thêm dịch vụ', e);
    } finally {
      setLoading(false);
    }
  };

  // Remove Service from DID
  const handleRemoveService = async () => {
    if (!serviceId) {
      showError('ID dịch vụ không được để trống');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/service/${encodeURIComponent(serviceId)}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showSuccess('Xóa dịch vụ của DID thành công!');
        // Clear the service ID
        setServiceId('');
        // Refresh the details
        fetchDIDDetails();
      } else {
        showError('Lỗi xóa dịch vụ của DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API xóa dịch vụ', e);
    } finally {
      setLoading(false);
    }
  };

  // Link DIDs
  const handleLinkDids = async () => {
    if (!targetDid) {
      showError('DID đích không được để trống');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_did: did,
          target_did: targetDid,
          relationship: relationship
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showSuccess('Liên kết DID thành công!');
        // Clear target DID
        setTargetDid('');
      } else {
        showError('Lỗi liên kết DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API liên kết DID', e);
    } finally {
      setLoading(false);
    }
  };

  // Transfer DID ownership
  const handleTransferDid = async () => {
    if (!newController) {
      showError('Người kiểm soát mới không được để trống');
      return;
    }
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
      
      if (res.ok) {
        showSuccess('Chuyển quyền sở hữu DID thành công!');
        // Navigate to the show page after transfer
        router.push(`/eduid/show?did=${encodeURIComponent(did)}`);
      } else {
        showError('Lỗi chuyển quyền sở hữu DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API chuyển quyền sở hữu DID', e);
    } finally {
      setLoading(false);
    }
  };

  // Revoke DID
  const handleRevokeDid = async () => {
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
      
      if (res.ok) {
        showSuccess('Thu hồi DID thành công!');
        // Navigate back to the main EduID page after revocation
        router.push('/eduid');
      } else {
        showError('Lỗi thu hồi DID', data);
      }
    } catch (e) {
      showError('Lỗi khi gọi API thu hồi DID', e);
    } finally {
      setLoading(false);
    }
  };

  // Create EduCert for DID
  const handleCreateEduCert = async () => {
    if (!credential) {
      showError('Dữ liệu chứng chỉ không được để trống');
      return;
    }
    setLoading(true);
    try {
      let credentialData;
      try {
        credentialData = JSON.parse(credential);
      } catch (e) {
        showError('Dữ liệu chứng chỉ không phải là JSON hợp lệ');
        setLoading(false);
        return;
      }
      const res = await fetch(`${NODEINFO_URL}/api/v1/did/${encodeURIComponent(did)}/educert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credential_data: credentialData
        })
      });
      
      const data = await res.json();
      
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

  if (initialLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin DID...</div>
      </div>
    );
  }

  if (!didDetails) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Title level={3}>Không tìm thấy DID</Title>
        <Button onClick={() => router.push('/eduid')}>Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={2}>Chỉnh sửa DID</Title>
            <Space>
              <Button onClick={() => router.push(`/eduid/show?did=${encodeURIComponent(did)}`)}>Xem chi tiết</Button>
              <Button onClick={() => router.push('/eduid')}>Quay lại danh sách</Button>
            </Space>
          </Space>
          
          <Paragraph>
            <Text strong>DID: </Text>{did}
          </Paragraph>
          
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'update',
                label: 'Cập nhật DID',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form layout="vertical">
                      <Form.Item label="Người kiểm soát mới (tùy chọn)">
                        <Input 
                          placeholder="Địa chỉ người kiểm soát mới" 
                          value={controller} 
                          onChange={(e) => setController(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Form.Item label="Khóa công khai mới (tùy chọn)">
                        <Input 
                          placeholder="Khóa công khai mới" 
                          value={publicKey} 
                          onChange={(e) => setPublicKey(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Button 
                        type="primary" 
                        onClick={handleUpdate} 
                        loading={loading}
                      >
                        Cập nhật DID
                      </Button>
                    </Form>
                  </Space>
                ),
              },
              {
                key: 'service',
                label: 'Dịch vụ',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form layout="vertical">
                      <Divider>Thêm dịch vụ mới</Divider>
                      
                      <Form.Item label="ID dịch vụ">
                        <Input 
                          placeholder="ID dịch vụ (để trống sẽ tự động tạo)" 
                          value={serviceId} 
                          onChange={(e) => setServiceId(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Form.Item label="Tên dịch vụ">
                        <Input 
                          placeholder="Tên dịch vụ" 
                          value={serviceName} 
                          onChange={(e) => setServiceName(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Form.Item label="Loại dịch vụ">
                        <Input 
                          placeholder="Loại dịch vụ (ví dụ: DIDCommMessaging)" 
                          value={serviceType} 
                          onChange={(e) => setServiceType(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Form.Item label="Endpoint dịch vụ" required>
                        <Input 
                          placeholder="Endpoint dịch vụ (URL)" 
                          value={serviceEndpoint} 
                          onChange={(e) => setServiceEndpoint(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Button 
                        type="primary" 
                        onClick={handleAddService} 
                        loading={loading}
                        disabled={!serviceEndpoint}
                      >
                        Thêm dịch vụ
                      </Button>
                      
                      <Divider>Xóa dịch vụ</Divider>
                      
                      <Form.Item label="ID dịch vụ cần xóa" required>
                        <Input 
                          placeholder="ID dịch vụ cần xóa" 
                          value={serviceId} 
                          onChange={(e) => setServiceId(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Button 
                        danger
                        onClick={handleRemoveService} 
                        loading={loading}
                        disabled={!serviceId}
                      >
                        Xóa dịch vụ
                      </Button>
                    </Form>
                  </Space>
                ),
              },
              {
                key: 'link',
                label: 'Liên kết',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form layout="vertical">
                      <Form.Item label="DID đích" required>
                        <Input 
                          placeholder="DID đích cần liên kết" 
                          value={targetDid} 
                          onChange={(e) => setTargetDid(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Form.Item label="Quan hệ" required>
                        <Select
                          value={relationship}
                          onChange={(value) => setRelationship(value)}
                          style={{ width: '100%' }}
                        >
                          {RELATIONSHIP_TYPES.map(type => (
                            <Option key={type.value} value={type.value}>{type.label}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Button 
                        type="primary" 
                        onClick={handleLinkDids} 
                        loading={loading}
                        disabled={!targetDid}
                      >
                        Liên kết DIDs
                      </Button>
                    </Form>
                  </Space>
                ),
              },
              {
                key: 'transfer',
                label: 'Chuyển quyền',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form layout="vertical">
                      <Form.Item 
                        label="Người kiểm soát mới" 
                        required 
                        help="Việc chuyển quyền sẽ cấp quyền quản lý DID cho người kiểm soát mới và bạn sẽ mất quyền kiểm soát DID này."
                      >
                        <Input 
                          placeholder="Địa chỉ người kiểm soát mới" 
                          value={newController} 
                          onChange={(e) => setNewController(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Form.Item label="Khóa công khai mới (tùy chọn)">
                        <Input 
                          placeholder="Khóa công khai mới" 
                          value={publicKey} 
                          onChange={(e) => setPublicKey(e.target.value)} 
                        />
                      </Form.Item>
                      
                      <Button 
                        type="primary" 
                        danger
                        onClick={() => showConfirmModal(
                          'transfer',
                          'Xác nhận chuyển quyền DID',
                          `Bạn có chắc chắn muốn chuyển quyền kiểm soát DID "${did}" cho "${newController}" không? Sau khi chuyển quyền, bạn sẽ không còn quyền kiểm soát DID này nữa.`
                        )}
                        disabled={!newController}
                      >
                        Chuyển quyền sở hữu
                      </Button>
                    </Form>
                  </Space>
                ),
              },
              {
                key: 'revoke',
                label: 'Thu hồi',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form layout="vertical">
                      <Form.Item 
                        label="Lý do thu hồi (tùy chọn)" 
                        help="Lưu ý: Việc thu hồi DID là không thể hoàn tác và DID sẽ không còn sử dụng được nữa."
                      >
                        <TextArea 
                          placeholder="Lý do thu hồi DID" 
                          value={revokeReason} 
                          onChange={(e) => setRevokeReason(e.target.value)} 
                          rows={3}
                        />
                      </Form.Item>
                      
                      <Button 
                        type="primary" 
                        danger
                        onClick={() => showConfirmModal(
                          'revoke',
                          'Xác nhận thu hồi DID',
                          `Bạn có chắc chắn muốn thu hồi DID "${did}" không? Hành động này không thể hoàn tác và DID sẽ không còn sử dụng được nữa.`
                        )}
                      >
                        Thu hồi DID
                      </Button>
                    </Form>
                  </Space>
                ),
              },
              {
                key: 'educert',
                label: 'EduCert',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form layout="vertical">
                      <Form.Item label="Dữ liệu chứng chỉ (JSON)" required>
                        <TextArea 
                          placeholder='Dữ liệu chứng chỉ theo định dạng JSON. Ví dụ: {"type": "BachelorDegree", "name": "Nguyễn Văn A", "degree": "Công nghệ thông tin"}' 
                          value={credential} 
                          onChange={(e) => setCredential(e.target.value)} 
                          rows={5}
                        />
                      </Form.Item>
                      
                      <Button 
                        type="primary" 
                        onClick={handleCreateEduCert} 
                        loading={loading}
                        disabled={!credential}
                      >
                        Tạo chứng chỉ
                      </Button>
                    </Form>
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Card>

      <Modal
        title={confirmModalTitle}
        open={isConfirmModalVisible}
        onOk={handleConfirm}
        onCancel={() => setIsConfirmModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        okButtonProps={{ danger: true }}
      >
        <p>{confirmModalContent}</p>
      </Modal>
    </div>
  );
}
