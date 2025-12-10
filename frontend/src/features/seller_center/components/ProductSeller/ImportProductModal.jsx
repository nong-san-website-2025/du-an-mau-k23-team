import React, { useState } from "react";
import { 
  Modal, Upload, Button, message, Typography, 
  List, Alert, Steps, Card, Collapse, 
  Divider
} from "antd";
import { 
  InboxOutlined, 
  DownloadOutlined, 
  FileExcelOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import { productApi } from "../../services/api/productApi"; 

const { Dragger } = Upload;
const { Text, Title, Link } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

const ImportProductModal = ({ visible, onClose, onSuccess }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null); // Kết quả trả về từ server

  // --- 1. Xử lý Upload ---
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", fileList[0]);

    setUploading(true);
    setResult(null);

    try {
      const res = await productApi.importExcel(formData);
      // Giả sử API trả về: { total: 10, success: 8, errors: ["Dòng 2: Sai tên", ...] }
      setResult(res.data || res); 
      
      if (res.data?.success > 0) {
          message.success(`Đã nhập thành công ${res.data.success} sản phẩm!`);
          onSuccess(); // Refresh bảng dữ liệu bên ngoài
      } else {
          message.warning("Vui lòng kiểm tra lại file dữ liệu.");
      }
      setFileList([]); // Clear file sau khi up
    } catch (error) {
      console.error(error);
      message.error("Lỗi kết nối hoặc định dạng file không hợp lệ.");
    } finally {
      setUploading(false);
    }
  };

  // --- 2. Cấu hình Upload ---
  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      setResult(null);
    },
    beforeUpload: (file) => {
      const isExcel =
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel";
      if (!isExcel) {
        message.error(`${file.name} không phải là file Excel!`);
        return Upload.LIST_IGNORE;
      }
      setFileList([file]); // Chỉ giữ 1 file
      setResult(null); // Reset kết quả cũ
      return false; // Chặn auto upload
    },
    fileList,
    maxCount: 1
  };

  // --- 3. Tải file mẫu ---
  const downloadTemplate = () => {
     // Bạn nên để file này trong folder public/templates/
     const link = document.createElement('a');
     link.href = '/templates/Mau_Nhap_San_Pham.xlsx'; 
     link.download = 'Mau_Nhap_San_Pham.xlsx';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // --- 4. Render UI ---
  return (
    <Modal
      open={visible}
      title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileExcelOutlined style={{ color: '#217346' }} /> 
              Nhập sản phẩm từ Excel
          </div>
      }
      onCancel={() => { onClose(); setResult(null); setFileList([]); }}
      width={700}
      footer={[
        <Button key="back" onClick={onClose}>Đóng</Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleUpload}
          disabled={fileList.length === 0}
          loading={uploading}
          style={{ backgroundColor: '#217346', borderColor: '#217346' }} // Màu xanh Excel
        >
          {uploading ? "Đang xử lý..." : "Tiến hành Import"}
        </Button>,
      ]}
    >
      {/* Bước 1: Hướng dẫn */}
      <Steps current={fileList.length > 0 ? 1 : 0} size="small" style={{ marginBottom: 24 }}>
        <Step title="Tải mẫu" description="Tải file Excel mẫu" />
        <Step title="Điền dữ liệu" description="Nhập thông tin SP" />
        <Step title="Tải lên" description="Upload file đã nhập" />
      </Steps>

      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <Text strong>Chưa có file mẫu?</Text>
                <div style={{ fontSize: 12, color: '#666' }}>Tải về để điền đúng định dạng quy định.</div>
            </div>
            <Button 
                type="dashed" 
                icon={<DownloadOutlined />} 
                onClick={downloadTemplate}
            >
                Tải file mẫu
            </Button>
        </div>
      </div>

      <Collapse ghost style={{ marginBottom: 16 }}>
        <Panel header="Lưu ý quan trọng khi điền file (Nhấn để xem)" key="1">
           <ul style={{ fontSize: 13, color: '#555', paddingLeft: 20, margin: 0 }}>
               <li>Không thay đổi tên cột ở dòng đầu tiên.</li>
               <li>Cột <b>Danh mục</b> và <b>Nhóm hàng</b> phải nhập chính xác tên đang có trên hệ thống.</li>
               <li>Cột <b>Giá</b> chỉ nhập số, không nhập chữ (Vd: 100000, không nhập 100k).</li>
               <li>Các dòng bị lỗi sẽ được bỏ qua, các dòng đúng vẫn được nhập bình thường.</li>
           </ul>
        </Panel>
      </Collapse>

      {/* Vùng Upload */}
      <Dragger {...uploadProps} style={{ marginBottom: 20 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: '#217346' }} />
        </p>
        <p className="ant-upload-text">Kéo thả file Excel vào đây hoặc nhấn để chọn</p>
        <p className="ant-upload-hint">Chỉ hỗ trợ file định dạng .xlsx, .xls</p>
      </Dragger>

      {/* Hiển thị kết quả sau khi Import */}
      {result && (
        <Card 
            size="small" 
            title="Kết quả nhập liệu" 
            bordered={false}
            style={{ background: result.errors?.length > 0 ? '#fff1f0' : '#f6ffed', border: '1px solid #d9d9d9' }}
        >
          <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
              <Text type="success"><CheckCircleOutlined /> Thành công: <b>{result.success}/{result.total}</b></Text>
              {result.errors?.length > 0 && <Text type="danger"><CloseCircleOutlined /> Lỗi: <b>{result.errors.length}</b></Text>}
          </div>

          {result.errors && result.errors.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong type="danger" style={{ fontSize: 13 }}>Chi tiết lỗi:</Text>
              <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 8, background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #ffccc7' }}>
                  {result.errors.map((err, index) => (
                      <div key={index} style={{ fontSize: 12, marginBottom: 4, color: '#cf1322' }}>
                          • {err}
                      </div>
                  ))}
              </div>
            </>
          )}
        </Card>
      )}
    </Modal>
  );
};

export default ImportProductModal;