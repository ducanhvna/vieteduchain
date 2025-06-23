"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NODEINFO_URL, API_BASE_URL } from '@/config';
import { 
  Card, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Select, 
  Form, 
  message as antdMessage
} from 'antd';

const { Title } = Typography;
const { Option } = Select;

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

export default function CreateDIDPage() {
  const router = useRouter();
  const [entityType, setEntityType] = useState('Individual');
  const [entitySubtype, setEntitySubtype] = useState('Student');
  const [controller, setController] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [serviceEndpoint, setServiceEndpoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountOptions, setAccountOptions] = useState<any[]>([]);

  // Fetch real user accounts from Cosmos API
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cosmos/auth/v1beta1/accounts`);
        if (res.ok) {
          const data = await res.json();
          // Lọc BaseAccount có pub_key khác null
          const users = (data.accounts || []).filter((acc: any) =>
            acc['@type'] === '/cosmos.auth.v1beta1.BaseAccount' && acc.pub_key
          );
          setAccountOptions(users);
        }
      } catch (e) {
        // Không cần báo lỗi nếu không lấy được
      }
    };
    fetchAccounts();
  }, []);

  // Get available entity subtypes based on selected entity type
  const getSubtypes = () => {
    return ENTITY_SUBTYPES[entityType as keyof typeof ENTITY_SUBTYPES] || [];
  };

  // Register new DID
  const handleRegister = async () => {
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
            id: `did:eduid:generated#service-1`,
            type: "DIDCommMessaging",
            serviceEndpoint: serviceEndpoint
          }] : undefined
        })
      });
      
      const data = await res.json();
      
      if (res.status === 201) {
        antdMessage.success('Đăng ký DID thành công!');
        // After successful registration, navigate to show page
        if (data.id) {
          router.push(`/eduid/show?did=${encodeURIComponent(data.id)}`);
        } else {
          router.push('/eduid');
        }
      } else {
        const errorMsg = data?.detail || data?.message || 'Lỗi đăng ký DID';
        antdMessage.error(errorMsg);
      }
    } catch (e) {
      antdMessage.error('Lỗi khi gọi API đăng ký DID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: 24 }}>Đăng ký Danh tính tự chủ (EduID)</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form layout="vertical">
            <Form.Item label="Loại thực thể">
              <Select
                value={entityType}
                onChange={(value) => {
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
                onChange={(value) => setEntitySubtype(value)}
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
            
            <Form.Item label="Khóa công khai" required>
              <Input 
                placeholder="Khóa công khai (Public Key)" 
                value={publicKey} 
                onChange={(e) => setPublicKey(e.target.value)} 
              />
            </Form.Item>
            
            <Form.Item label="Endpoint dịch vụ (tùy chọn)">
              <Input 
                placeholder="Endpoint dịch vụ" 
                value={serviceEndpoint} 
                onChange={(e) => setServiceEndpoint(e.target.value)} 
              />
            </Form.Item>
            
            <Space>
              <Button 
                type="primary" 
                onClick={handleRegister} 
                loading={loading}
                disabled={!publicKey}
              >
                Đăng ký DID
              </Button>
              
              <Button onClick={() => router.push('/eduid')}>
                Hủy bỏ
              </Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
