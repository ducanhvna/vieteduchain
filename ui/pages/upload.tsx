import { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    // TODO: Gửi file lên backend để xác thực
    setMessage('Đã gửi file lên xác thực (giả lập).');
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Upload Bằng Để Xác Thực</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file} style={{ marginLeft: 8 }}>
        Upload
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
