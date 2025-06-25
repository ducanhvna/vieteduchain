import os
from minio import Minio
from minio.error import S3Error

# Ưu tiên dùng localhost:9000 nếu chạy ngoài docker
MINIO_ENDPOINT = os.environ.get("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.environ.get("MINIO_SECRET_KEY", "minioadmin")
BUCKET_NAME = os.environ.get("MINIO_BUCKET", "educhain-data")

client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

def test_minio_file():
    test_file = "test_minio.txt"
    test_content = b"Hello from MinIO test!"
    # Tạo file tạm
    with open(test_file, "wb") as f:
        f.write(test_content)
    try:
        # Upload file
        client.fput_object(BUCKET_NAME, test_file, test_file)
        print(f"Uploaded {test_file} to bucket {BUCKET_NAME}")
        # Download lại file
        client.fget_object(BUCKET_NAME, test_file, f"downloaded_{test_file}")
        print(f"Downloaded {test_file} from bucket {BUCKET_NAME}")
        # Kiểm tra nội dung
        with open(f"downloaded_{test_file}", "rb") as f:
            content = f.read()
        assert content == test_content, "File content mismatch!"
        print("MinIO file upload/download test: SUCCESS")
    except S3Error as e:
        print(f"MinIO error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Xoá file tạm
        if os.path.exists(test_file):
            os.remove(test_file)
        if os.path.exists(f"downloaded_{test_file}"):
            os.remove(f"downloaded_{test_file}")

if __name__ == "__main__":
    test_minio_file()
