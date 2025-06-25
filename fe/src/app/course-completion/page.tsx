"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL, NODEINFO_URL } from '@/config';
import { Card, Button, Input, Form, Table, message as antdMessage, Space, Typography, Select, DatePicker, InputNumber, Tabs } from 'antd';

const { Paragraph } = Typography;
const { Option } = Select;

export default function Page() {
  const [form] = Form.useForm();
  const [courseCompletions, setCourseCompletions] = useState<any[]>([]);
  const [courseOptions, setCourseOptions] = useState<{label: string, value: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('course-completion');
  const [enrollForm] = Form.useForm();
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollResult, setEnrollResult] = useState<any>(null);
  const [createClassForm] = Form.useForm();
  const [createClassLoading, setCreateClassLoading] = useState(false);
  const [createClassResult, setCreateClassResult] = useState<any>(null);

  useEffect(() => {
    fetchCourseCompletions();
    fetchCourseOptions();
  }, []);

  useEffect(() => {
    if (activeTab === 'student-trace') fetchStudentList();
  }, [activeTab]);

  const handleCreateCourseCompletion = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/create_course_completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_did: values.studentDid,
          course_id: values.courseId,
          course_name: values.courseName,
          completion_date: values.completionDate.format('YYYY-MM-DD'),
          grade: values.grade,
          credits: values.credits,
          instructor_did: values.instructorDid,
          institution_did: values.institutionDid,
          metadata: values.metadata
        })
      });
      const data = await res.json();
      if (res.ok) {
        antdMessage.success('Course completion record created successfully!');
        form.resetFields();
        fetchCourseCompletions();
      } else {
        antdMessage.error(data.detail || 'Failed to create course completion record');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseCompletions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/list_course_completions`);
      if (res.ok) {
        const data = await res.json();
        setCourseCompletions(data);
      } else {
        antdMessage.error('Failed to fetch course completion records');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseOptions = async () => {
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did?entity_subtype=Course&limit=1000`);
      const data = await res.json();
      setCourseOptions(
        (data.items || []).map((item: any) => ({
          label: item.name ? `${item.name} (${item.id})` : item.id,
          value: item.id
        }))
      );
    } catch {}
  };

  const fetchStudentList = async () => {
    try {
      const res = await fetch(`${NODEINFO_URL}/api/v1/did?entity_type=Individual&entity_subtype=Student&limit=1000`);
      const data = await res.json();
      setStudentList(data.items || []);
    } catch {}
  };

  const verifyCourseCompletion = async (recordId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/educert/verify_course_completion?record_id=${recordId}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        antdMessage.success('Course completion verification successful!');
      } else {
        antdMessage.error(data.detail || 'Course completion verification failed');
      }
    } catch (e) {
      antdMessage.error('Error connecting to the API');
    }
  };

  // Đăng ký lớp học
  const handleEnrollCourse = async (values: any) => {
    setEnrollLoading(true);
    setEnrollResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/edu-admission/enroll-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_did: values.studentDid,
          course_did: values.courseDid
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        antdMessage.success('Đăng ký lớp học thành công!');
        enrollForm.resetFields();
        setEnrollResult(data);
      } else {
        antdMessage.error(data.detail || 'Đăng ký lớp học thất bại');
      }
    } catch (e) {
      antdMessage.error('Lỗi kết nối API');
    } finally {
      setEnrollLoading(false);
    }
  };

  // Tạo lớp học (DID sub_type=Course)
  const handleCreateClass = async (values: { name: string; description?: string }) => {
    setCreateClassLoading(true);
    setCreateClassResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/did`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'Course',
          entity_subtype: 'Course',
          name: values.name,
          description: values.description || '',
        })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        antdMessage.success('Tạo lớp học thành công!');
        createClassForm.resetFields();
        setCreateClassResult(data);
        fetchCourseOptions(); // cập nhật danh sách lớp học
      } else {
        antdMessage.error(data.detail || 'Tạo lớp học thất bại');
      }
    } catch (e) {
      antdMessage.error('Lỗi kết nối API');
    } finally {
      setCreateClassLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 900, margin: '32px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Course Completion Management</h2>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'class-registration',
            label: 'Đăng ký lớp học',
            children: (
              <Card title="Đăng ký lớp học">
                <Form
                  form={enrollForm}
                  layout="vertical"
                  onFinish={handleEnrollCourse}
                  style={{ maxWidth: 500 }}
                >
                  <Form.Item
                    name="studentDid"
                    label="Student DID"
                    rules={[{ required: true, message: 'Chọn học sinh' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Chọn học sinh (DID)"
                      options={studentList.map((s: any) => ({ label: s.name ? `${s.name} (${s.id})` : s.id, value: s.id }))}
                      filterOption={(input: string, option?: { label: string; value: string }) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    />
                  </Form.Item>
                  <Form.Item
                    name="courseDid"
                    label="Class DID"
                    rules={[{ required: true, message: 'Chọn lớp học' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Chọn lớp học (DID)"
                      options={courseOptions}
                      filterOption={(input: string, option?: { label: string; value: string }) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={enrollLoading}>
                      Đăng ký lớp học
                    </Button>
                  </Form.Item>
                </Form>
                {enrollResult && (
                  <Card title="Kết quả đăng ký" style={{ marginTop: 24 }}>
                    <Paragraph copyable>{JSON.stringify(enrollResult, null, 2)}</Paragraph>
                  </Card>
                )}
              </Card>
            ),
          },
          {
            key: 'create-class',
            label: 'Tạo lớp học',
            children: (
              <Card title="Tạo lớp học mới">
                <Form
                  form={createClassForm}
                  layout="vertical"
                  onFinish={handleCreateClass}
                  style={{ maxWidth: 500 }}
                >
                  <Form.Item
                    name="name"
                    label="Tên lớp học"
                    rules={[{ required: true, message: 'Nhập tên lớp học' }]}
                  >
                    <Input placeholder="Nhập tên lớp học" />
                  </Form.Item>
                  <Form.Item
                    name="description"
                    label="Mô tả (tuỳ chọn)"
                  >
                    <Input.TextArea placeholder="Mô tả về lớp học" rows={3} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={createClassLoading}>
                      Tạo lớp học
                    </Button>
                  </Form.Item>
                </Form>
                {createClassResult && (
                  <Card title="Kết quả tạo lớp học" style={{ marginTop: 24 }}>
                    <Paragraph copyable>{JSON.stringify(createClassResult, null, 2)}</Paragraph>
                  </Card>
                )}
              </Card>
            ),
          },
          {
            key: 'course-completion',
            label: 'Course Completion',
            children: (
              <>
                <Card title="Record New Course Completion" style={{ marginBottom: 24 }}>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateCourseCompletion}
                  >
                    <Form.Item
                      name="studentDid"
                      label="Student DID"
                      rules={[{ required: true, message: 'Please enter student DID' }]}
                    >
                      <Input placeholder="did:example:student123" />
                    </Form.Item>
                    
                    <Form.Item
                      name="courseId"
                      label="Course (DID)"
                      rules={[{ required: true, message: 'Please select course DID' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn khoá học (DID)"
                        options={courseOptions}
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    
                    <Form.Item
                      name="courseName"
                      label="Course Name"
                      rules={[{ required: true, message: 'Please enter course name' }]}
                    >
                      <Input placeholder="Introduction to Computer Science" />
                    </Form.Item>
                    
                    <Form.Item
                      name="completionDate"
                      label="Completion Date"
                      rules={[{ required: true, message: 'Please select completion date' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      name="grade"
                      label="Grade"
                      rules={[{ required: true, message: 'Please enter grade' }]}
                    >
                      <Input placeholder="A" />
                    </Form.Item>
                    
                    <Form.Item
                      name="credits"
                      label="Credits"
                      rules={[{ required: true, message: 'Please enter credits' }]}
                    >
                      <InputNumber min={0} placeholder="3" style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      name="instructorDid"
                      label="Instructor DID"
                      rules={[{ required: true, message: 'Please enter instructor DID' }]}
                    >
                      <Input placeholder="did:example:instructor123" />
                    </Form.Item>
                    
                    <Form.Item
                      name="institutionDid"
                      label="Institution DID"
                      rules={[{ required: true, message: 'Please enter institution DID' }]}
                    >
                      <Input placeholder="did:example:university123" />
                    </Form.Item>
                    
                    <Form.Item
                      name="metadata"
                      label="Metadata (Optional)"
                    >
                      <Input.TextArea placeholder="Additional information in JSON format" rows={4} />
                    </Form.Item>
                    
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        Create Course Completion Record
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
                
                <Card title="Course Completion Records">
                  <Button 
                    onClick={fetchCourseCompletions} 
                    style={{ marginBottom: 16 }}
                    loading={loading}
                  >
                    Refresh Records
                  </Button>
                  
                  <Table
                    dataSource={courseCompletions}
                    columns={[
                      { title: 'ID', dataIndex: 'id', key: 'id' },
                      { title: 'Course ID', dataIndex: 'course_id', key: 'courseId' },
                      { title: 'Course Name', dataIndex: 'course_name', key: 'courseName' },
                      { title: 'Student DID', dataIndex: 'student_did', key: 'studentDid' },
                      { title: 'Completion Date', dataIndex: 'completion_date', key: 'completionDate' },
                      { title: 'Grade', dataIndex: 'grade', key: 'grade' },
                      {
                        title: 'Action',
                        key: 'action',
                        render: (_, record) => (
                          <Button 
                            onClick={() => verifyCourseCompletion(record.id)}
                            size="small"
                          >
                            Verify
                          </Button>
                        ),
                      },
                    ]}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    loading={loading}
                  />
                </Card>
                
                {result && (
                  <Card title="Verification Result" style={{ marginTop: 24 }}>
                    <Paragraph copyable>{JSON.stringify(result, null, 2)}</Paragraph>
                  </Card>
                )}
              </>
            ),
          },
          {
            key: 'student-trace',
            label: 'Student Trace',
            children: (
              <Card title="Student List">
                <Table
                  dataSource={studentList}
                  columns={[
                    { title: 'Student DID', dataIndex: 'id', key: 'id' },
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    { title: 'Status', dataIndex: ['metadata', 'status'], key: 'status', render: (v, r) => r?.metadata?.status || '-' },
                  ]}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />
    </Card>
  );
}
