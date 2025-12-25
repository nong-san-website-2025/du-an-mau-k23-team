import React, { useState } from "react";
import { Modal, Upload, Table, Button, message, Steps, Typography, Alert, Tag } from "antd";
import { InboxOutlined, DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

const { Dragger } = Upload;
const { Step } = Steps;
const { Text } = Typography;

// --- ÁNH XẠ TIÊU ĐỀ CỘT LINH HOẠT ---
const HEADER_MAPPING = {
    "code": "code", "mã": "code", "ma": "code", "mã voucher": "code",
    "title": "title", "tiêu đề": "title", "tên": "title", "tên voucher": "title",
    "discount_type": "discount_type", "loại": "discount_type", "loại giảm": "discount_type",
    "value": "value", "giá trị": "value", "mức giảm": "value",
    "start_date": "start_date", "ngày bắt đầu": "start_date", "ngày bd": "start_date",
    "end_date": "end_date", "ngày kết thúc": "end_date", "ngày kt": "end_date",
    "quantity": "quantity", "số lượng": "quantity", "sl": "quantity",
    "per_user": "per_user_quantity", "lượt dùng/người": "per_user_quantity", "lượt/user": "per_user_quantity",
    "min_order": "min_order", "đơn tối thiểu": "min_order", "tối thiểu": "min_order"
};

export default function ImportVoucherModal({ open, onCancel, onImportAPI }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // --- 1. TẠO FILE MẪU EXCEL ---
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        code: "GIAM_TIEN_50K",
        title: "Giảm tiền trực tiếp",
        discount_type: "amount",
        value: 50000,
        start_date: "2025-06-01",
        end_date: "2025-06-30",
        quantity: 100,
        min_order: 200000
      },
      {
        code: "GIAM_10_PERCENT",
        title: "Giảm theo phần trăm",
        discount_type: "percent",
        value: 10,
        start_date: "2025-01-01",
        end_date: "2025-12-31",
        quantity: 50,
        min_order: 0
      },
      {
        code: "FREESHIP_30K",
        title: "Miễn phí vận chuyển",
        discount_type: "freeship", // Backend cần chữ này
        value: 30000, // Giá trị tối đa
        start_date: "2025-01-01",
        end_date: "2025-01-31",
        quantity: 200,
        min_order: 150000
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Voucher_Template.xlsx");
  };

  // --- 2. ĐỌC FILE EXCEL ---
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];

        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (jsonData.length === 0) {
          message.error("File rỗng!");
          return;
        }

        const validatedData = jsonData.map((row, index) => {
            // Chuyển đổi keys của row về lowercase và map sang key chuẩn
            const item = {};
            Object.keys(row).forEach(key => {
                const normalizedKey = key.toString().toLowerCase().trim();
                const mappedKey = HEADER_MAPPING[normalizedKey] || normalizedKey;
                item[mappedKey] = row[key];
            });

            const cleanNumber = (val) => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    const cleanString = val.replace(/[^0-9]/g, ''); 
                    return parseInt(cleanString, 10) || 0;
                }
                return 0;
            };

            const cleanDate = (val) => {
                if (!val) return null;
                // Nếu là số (Excel date serial)
                if (typeof val === 'number') {
                    const date = XLSX.utils.format_date(val); // Trả về dạng m/d/yy hoặc tương tự tùy version
                    return dayjs(date).format('YYYY-MM-DD');
                }
                const d = dayjs(val); 
                return d.isValid() ? d.format('YYYY-MM-DD') : val;
            };

            // Chuẩn hóa loại voucher
            let type = item.discount_type ? item.discount_type.toString().toLowerCase().trim() : 'amount';
            if (type.includes('phần trăm') || type.includes('%') || type.includes('percent')) type = 'percent';
            if (type.includes('tiền') || type.includes('amount') || type.includes('cố định')) type = 'amount';
            if (type.includes('freeship') || type.includes('vận chuyển')) type = 'freeship';

            const processedItem = {
                code: item.code?.toString().toUpperCase().trim(),
                title: item.title?.toString().trim(),
                discount_type: type,
                value: cleanNumber(item.value),
                quantity: cleanNumber(item.quantity) || 100, // Mặc định 100 nếu thiếu
                per_user_quantity: cleanNumber(item.per_user_quantity) || 1, // Mặc định 1
                min_order: cleanNumber(item.min_order),
                start_date: cleanDate(item.start_date),
                end_date: cleanDate(item.end_date),
            };

            return {
                key: index,
                ...processedItem,
                isValid: !!(processedItem.code && processedItem.title && processedItem.value && processedItem.start_date && processedItem.end_date), 
            };
        });

        setTableData(validatedData);
        setCurrentStep(1); 
        message.success(`Đã đọc được ${jsonData.length} dòng dữ liệu`);
      } catch (error) {
        console.error(error);
        message.error("Lỗi đọc file Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  // --- 3. GỬI DỮ LIỆU ---
  const handleSubmit = async () => {
    // Chỉ lọc các dòng hợp lệ để gửi đi
    const validData = tableData.filter(item => item.isValid);
    
    if (validData.length === 0) {
        message.error("Không có dữ liệu hợp lệ để import!");
        return;
    }

    setLoading(true);
    setErrors([]);
    try {
      const payload = validData.map(({ key, isValid, ...rest }) => rest);
      await onImportAPI(payload); 
      message.success(`Import thành công ${validData.length} voucher!`);
      handleReset(); 
      onCancel();    
    } catch (err) {
      console.error("Import Error:", err);
      const resData = err.response?.data;
      
      if (resData?.errors && Array.isArray(resData.errors)) {
          // Lỗi chi tiết từng dòng từ Serializer (many=True)
          const errorList = resData.errors.map((e, i) => {
             if (Object.keys(e).length === 0) return null;
             const details = Object.entries(e).map(([k, v]) => {
                const fieldName = HEADER_MAPPING[k] || k;
                return `${fieldName}: ${v}`;
             }).join(', ');
             return `Dòng ${i+1}: ${details}`;
          }).filter(item => item !== null);
          setErrors(errorList);
      } else if (resData?.error) {
          setErrors([resData.error]);
      } else if (resData?.message) {
          setErrors([resData.message]);
      } else {
          setErrors(["Lỗi kết nối Server hoặc dữ liệu không đúng định dạng."]);
      }
      message.error("Import thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTableData([]);
    setCurrentStep(0);
    setErrors([]);
  };

  // --- [QUAN TRỌNG] CẤU HÌNH CỘT BẢNG (ĐÃ VIỆT HÓA) ---
  const columns = [
    { 
      title: "Mã", 
      dataIndex: "code",
      render: (text) => <Text strong>{text}</Text> 
    },
    { title: "Tên", dataIndex: "title", ellipsis: true },
    { 
      title: "Loại giảm", 
      dataIndex: "discount_type",
      width: 180, // Thêm độ rộng để hiển thị chữ dài không bị xuống dòng xấu
      render: (text) => {
          let color = 'default';
          let label = text; // Mặc định hiển thị gốc

          if (text === 'percent') {
              color = 'blue';
              label = 'Giảm %';
          }
          if (text === 'amount') {
              color = 'green';
              label = 'Giảm tiền';
          }
          if (text === 'freeship') {
              color = 'purple';
              label = 'Miễn phí vận chuyển'; // <--- ĐÃ SỬA CHỖ NÀY
          }
          return <Tag color={color}>{label}</Tag>
      }
    },
    { 
        title: "Giá trị", 
        dataIndex: "value",
        render: (val) => val?.toLocaleString() 
    },
    { 
      title: "Ngày BĐ", 
      dataIndex: "start_date",
      render: (date) => {
        const isValid = dayjs(date, 'YYYY-MM-DD', true).isValid();
        return <Text type={isValid ? "" : "danger"}>{date}</Text>
      }
    },
    { title: "SL", dataIndex: "quantity", width: 80 },
    { title: "Lượt/User", dataIndex: "per_user_quantity", width: 100 },
    {
        title: "Trạng thái",
        key: "status",
        render: (_, record) => (
            record.isValid 
            ? <Tag color="success">Hợp lệ</Tag> 
            : <Tag color="error">Thiếu</Tag>
        )
    }
  ];

  return (
    <Modal
      open={open}
      title={
          <div className="flex items-center gap-2">
              <FileExcelOutlined style={{ color: '#217346' }} /> 
              Import Voucher từ Excel
          </div>
      }
      onCancel={onCancel}
      width={950} // Tăng độ rộng modal một chút cho thoải mái
      maskClosable={false}
      footer={[
        <Button key="back" onClick={currentStep === 1 ? () => setCurrentStep(0) : onCancel}>
          {currentStep === 1 ? "Chọn lại file" : "Hủy"}
        </Button>,
        currentStep === 1 && (
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            Tiến hành Import ({tableData.length} dòng)
          </Button>
        ),
      ]}
    >
      <Steps current={currentStep} className="mb-6" size="small">
        <Step title="Upload File" description="Tải file mẫu & Upload" />
        <Step title="Kiểm tra dữ liệu" description="Review trước khi lưu" />
        <Step title="Hoàn tất" />
      </Steps>

      {currentStep === 0 && (
        <div className="p-4 bg-gray-50 rounded-md border border-dashed border-gray-300">
          <div className="flex justify-between items-center mb-4">
            <Text>1. Tải file mẫu chuẩn (Hỗ trợ Freeship, Discount):</Text>
            <Button type="dashed" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              Tải file mẫu .xlsx
            </Button>
          </div>
          <Dragger
            accept=".xlsx, .xls"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            className="bg-white"
            style={{ padding: '20px 0' }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#1677ff' }} /></p>
            <p className="ant-upload-text">Nhấp hoặc kéo thả file Excel vào đây</p>
            <p className="ant-upload-hint">Hỗ trợ .xlsx, .xls. Tự động chuẩn hóa dữ liệu.</p>
          </Dragger>
        </div>
      )}

      {currentStep === 1 && (
        <div>
           {errors.length > 0 && (
             <Alert
               message="Lỗi từ Server"
               description={<ul className="pl-4 list-disc max-h-32 overflow-y-auto">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
               type="error"
               showIcon
               className="mb-4"
             />
           )}
           <div className="mb-2 flex justify-between items-center">
                <Text type="secondary">Đang xem trước {tableData.length} bản ghi.</Text>
                <Tag color="warning">Chưa lưu vào hệ thống</Tag>
           </div>
           <Table 
             dataSource={tableData} 
             columns={columns} 
             size="small" 
             pagination={{ pageSize: 5 }}
             scroll={{ y: 300 }}
             rowClassName={(record) => !record.isValid ? 'bg-red-50' : ''}
             bordered
           />
        </div>
      )}
    </Modal>
  );
}