import React, { useState } from "react";
import {
  Modal,
  Button,
  Upload,
  message,
  Steps,
  Alert,
  Table,
  Space,
  Spin,
  Row,
  Col,
  Card,
  Divider,
} from "antd";
import {
  DownloadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  importFlashSaleExcel,
  downloadFlashSaleTemplate,
} from "../../services/flashsaleApi";

const FlashSaleImportModal = ({ visible, onCancel, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const response = await downloadFlashSaleTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "flash_sale_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("Template đã tải thành công");
    } catch (error) {
      message.error("Không tải được template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.file;
    if (
      selectedFile &&
      (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls"))
    ) {
      setFile(selectedFile);
      setCurrentStep(1);
    } else {
      message.error("Vui lòng chọn file Excel (.xlsx hoặc .xls)");
    }
  };

  const handleImport = async () => {
    if (!file) {
      message.error("Vui lòng chọn file trước");
      return;
    }

    setLoading(true);
    try {
      const response = await importFlashSaleExcel(file);
      setResult(response.data);
      setCurrentStep(2);

      if (response.data.success) {
        message.success(response.data.message);
      }
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Import thất bại. Vui lòng kiểm tra file lại"
      );
      setResult(error.response?.data);
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFile(null);
    setResult(null);
    if (result?.success) {
      onSuccess?.();
    }
    onCancel?.();
  };

  const steps = [
    {
      title: "Tải Template",
      description: "Tải file mẫu Excel",
    },
    {
      title: "Chọn File",
      description: "Chọn file để import",
    },
    {
      title: "Kết Quả",
      description: "Xem kết quả import",
    },
  ];

  const columns = [
    {
      title: "Lỗi",
      dataIndex: "error",
      key: "error",
      render: (text) => <span style={{ color: "#ff4d4f" }}>{text}</span>,
    },
  ];

  const warningColumns = [
    {
      title: "Cảnh Báo",
      dataIndex: "warning",
      key: "warning",
      render: (text) => <span style={{ color: "#faad14" }}>{text}</span>,
    },
  ];

  return (
    <Modal
      title="Import Flash Sale từ Excel"
      visible={visible}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <Steps current={currentStep} items={steps} style={{ marginBottom: 30 }} />

      <div style={{ minHeight: 300 }}>
        {currentStep === 0 && (
          <Card>
            <h3>Bước 1: Tải Template Excel</h3>
            <p style={{ marginTop: 20 }}>
              Hãy tải file template Excel để biết định dạng đúng cho việc import
              dữ liệu:
            </p>

            <ul style={{ marginTop: 15 }}>
              <li>
                 ID sản phẩm (bắt buộc)
              </li>
              <li>
                 Tên sản phẩm (tùy chọn)
              </li>
              <li>
                 Giá flash sale (bắt buộc, phải &lt;
                giá gốc)
              </li>
              <li>
                Số lượng flash sale (bắt buộc, phải ≤
                tồn kho)
              </li>
              <li>
                 Thời gian bắt đầu (bắt buộc, định
                dạng YYYY-MM-DD HH:MM:SS)
              </li>
              <li>
                Thời gian kết thúc (bắt buộc, phải &gt;
                start_time)
              </li>
            </ul>

            <Divider />

            <h4>Lưu Ý:</h4>
            <ul>
              <li>
                Các sản phẩm có cùng thời gian sẽ được nhóm vào 1 Flash Sale
              </li>
              <li>
                Flash price phải thấp hơn giá gốc của sản phẩm
              </li>
              <li>
                Số lượng flash sale không được vượt quá tồn kho hiện tại
              </li>
              <li>
                Không được tạo Flash Sale trùng lịch với các chương trình đang
                chạy
              </li>
            </ul>

            <Row gutter={16} style={{ marginTop: 30 }}>
              <Col span={12}>
                <Button
                  block
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  loading={downloadingTemplate}
                  size="large"
                >
                  Tải Template Excel
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  onClick={() => setCurrentStep(1)}
                  size="large"
                >
                  Tiếp Tục →
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <h3>Bước 2: Chọn File Excel để Import</h3>

            <div style={{ marginTop: 30 }}>
              <Upload.Dragger
                accept=".xlsx,.xls"
                maxCount={1}
                onChange={handleFileChange}
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Kéo thả file hoặc click để chọn
                </p>
                <p className="ant-upload-hint">
                  Chỉ hỗ trợ file Excel (.xlsx hoặc .xls)
                </p>
              </Upload.Dragger>
            </div>

            {file && (
              <Alert
                message={`File được chọn: ${file.name}`}
                type="success"
                icon={<CheckCircleOutlined />}
                style={{ marginTop: 20 }}
              />
            )}

            <Row gutter={16} style={{ marginTop: 30 }}>
              <Col span={12}>
                <Button block onClick={() => setCurrentStep(0)} size="large">
                  ← Quay Lại
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  type="primary"
                  onClick={handleImport}
                  disabled={!file}
                  loading={loading}
                  size="large"
                >
                  Bắt Đầu Import →
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <Spin spinning={loading} tip="Đang xử lý...">
              <h3>Bước 3: Kết Quả Import</h3>

              {result && (
                <>
                  {result.success ? (
                    <Alert
                      message="Import Thành Công!"
                      description={result.message}
                      type="success"
                      icon={<CheckCircleOutlined />}
                      showIcon
                      style={{ marginTop: 20, marginBottom: 20 }}
                    />
                  ) : (
                    <Alert
                      message="Import Thất Bại"
                      description="Vui lòng kiểm tra các lỗi dưới đây"
                      type="error"
                      icon={<ExclamationCircleOutlined />}
                      showIcon
                      style={{ marginTop: 20, marginBottom: 20 }}
                    />
                  )}

                  {result.created_count > 0 && (
                    <Alert
                      message={`Tạo thành công ${result.created_count} chương trình Flash Sale`}
                      type="info"
                      style={{ marginBottom: 20 }}
                    />
                  )}

                  {result.errors && result.errors.length > 0 && (
                    <>
                      <h4 style={{ color: "#ff4d4f" }}>Lỗi ({result.errors.length})</h4>
                      <Table
                        dataSource={result.errors.map((error, idx) => ({
                          key: idx,
                          error,
                        }))}
                        columns={columns}
                        pagination={false}
                        style={{ marginBottom: 20 }}
                      />
                    </>
                  )}

                  {result.warnings && result.warnings.length > 0 && (
                    <>
                      <h4 style={{ color: "#faad14" }}>Cảnh Báo ({result.warnings.length})</h4>
                      <Table
                        dataSource={result.warnings.map((warning, idx) => ({
                          key: idx,
                          warning,
                        }))}
                        columns={warningColumns}
                        pagination={false}
                      />
                    </>
                  )}
                </>
              )}

              <Row gutter={16} style={{ marginTop: 30 }}>
                <Col span={12}>
                  <Button block onClick={() => setCurrentStep(1)} size="large">
                    ← Import File Khác
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    type="primary"
                    onClick={handleClose}
                    size="large"
                  >
                    Hoàn Thành
                  </Button>
                </Col>
              </Row>
            </Spin>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default FlashSaleImportModal;
