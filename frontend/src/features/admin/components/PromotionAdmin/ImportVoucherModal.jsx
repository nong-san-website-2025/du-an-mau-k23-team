import React, { useState } from "react";
import { Modal, Upload, Table, Button, message, Steps, Typography, Alert, Tag } from "antd";
import { InboxOutlined, DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

const { Dragger } = Upload;
const { Step } = Steps;
const { Text } = Typography;

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

        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            raw: false, 
            dateNF: 'yyyy-mm-dd' 
        });

        if (jsonData.length === 0) {
          message.error("File rỗng!");
          return;
        }

        const validatedData = jsonData.map((item, index) => {
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
                const d = dayjs(val); 
                return d.isValid() ? d.format('YYYY-MM-DD') : val;
            };

            // Chuẩn hóa loại voucher
            let type = item.discount_type ? item.discount_type.toString().toLowerCase().trim() : 'amount';

            return {
                key: index,
                ...item,
                discount_type: type,
                value: cleanNumber(item.value),
                quantity: cleanNumber(item.quantity),
                min_order: cleanNumber(item.min_order),
                start_date: cleanDate(item.start_date),
                end_date: cleanDate(item.end_date),
                isValid: item.code && item.title && item.value && item.start_date && item.end_date, 
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
    setLoading(true);
    setErrors([]);
    try {
      const payload = tableData.map(({ key, isValid, ...rest }) => rest);
      await onImportAPI(payload); 
      message.success("Import thành công!");
      handleReset(); 
      onCancel();    
    } catch (err) {
      console.error(err);
      const resData = err.response?.data;
      if (resData?.errors && Array.isArray(resData.errors)) {
          const errorList = resData.errors.map((e, i) => {
             const details = Object.entries(e).map(([k, v]) => `${k}: ${v}`).join(', ');
             return `Dòng ${i+1}: ${details}`;
          });
          setErrors(errorList);
      } else if (resData?.message) {
          setErrors([resData.message]);
      } else {
          setErrors(["Lỗi hệ thống (500). Kiểm tra lại Server/Database."]);
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
    { title: "SL", dataIndex: "quantity" },
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