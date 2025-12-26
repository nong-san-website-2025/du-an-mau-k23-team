import React, { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner, Card } from "react-bootstrap";
import { FaUniversity, FaSave } from "react-icons/fa";
import axiosInstance from "../../admin/services/axiosInstance";

const colors = {
  primary: "#4CAF50",
  background: "#FAFAF0",
  text: "#333",
  white: "#FFFFFF",
  border: "#E0E0E0",
};

const BANKS = [
  "Vietcombank",
  "Techcombank",
  "BIDV",
  "Vietinbank",
  "ACB",
  "MB Bank",
  "Agribank",
  "VPBank",
  "Sacombank",
  "TPBank",
  "HDBank",
  "VIB",
  "SHB",
  "MSB",
  "OCB",
  "NCB",
  "Eximbank",
  "SeABank",
  "Bac A Bank",
  "Dong A Bank",
  "Nam A Bank",
  "VietCapital Bank",
  "LienVietPostBank",
  "PVcomBank",
  "KienLongBank",
  "BaoVietBank",
  "ABBank",
  "VietBank",
  "PGBank",
  "GPBank",
  "SCB",
  "Cake by VPBank",
  "Timo by VPBank",
  "Ubank by VPBank",
];

function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    account_holder_name: "",
  });

  useEffect(() => {
    fetchBankInfo();
  }, []);

  const fetchBankInfo = async () => {
    try {
      const response = await axiosInstance.get("/users/bank-account/");
      setFormData({
        bank_name: response.data.bank_name || "",
        account_number: response.data.account_number || "",
        account_holder_name: response.data.account_holder_name || "",
      });
    } catch (err) {
      console.error("Error fetching bank info:", err);
      setError("Không thể tải thông tin ngân hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bank_name || !formData.account_number || !formData.account_holder_name) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.put("/users/bank-account/", formData);
      setSuccess(response.data.message || "Cập nhật thông tin ngân hàng thành công");
    } catch (err) {
      console.error("Error updating bank info:", err);
      setError(err.response?.data?.error || "Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: colors.primary }} />
        <div className="mt-3" style={{ color: colors.primary }}>
          Đang tải thông tin...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <FaUniversity size={24} style={{ color: colors.primary }} />
        <h4 className="mb-0" style={{ color: colors.primary, fontWeight: "bold" }}>
          Cài đặt thanh toán
        </h4>
      </div>

      <Card
        className="border-0 shadow-sm p-4"
        style={{ backgroundColor: colors.background }}
      >
        <p className="text-muted mb-4">
          Thông tin tài khoản ngân hàng dùng để nhận tiền hoàn trả khi có yêu cầu hoàn tiền.
        </p>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, color: colors.text }}>
              Ngân hàng <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              style={{
                borderColor: colors.border,
                borderRadius: 8,
              }}
            >
              <option value="">-- Chọn ngân hàng --</option>
              {BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, color: colors.text }}>
              Số tài khoản <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              placeholder="Nhập số tài khoản"
              style={{
                borderColor: colors.border,
                borderRadius: 8,
              }}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: 600, color: colors.text }}>
              Tên chủ tài khoản <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="account_holder_name"
              value={formData.account_holder_name}
              onChange={handleChange}
              placeholder="Nhập tên chủ tài khoản (viết in hoa)"
              style={{
                borderColor: colors.border,
                borderRadius: 8,
              }}
            />
            <Form.Text className="text-muted">
              Vui lòng nhập chính xác tên chủ tài khoản như trên thẻ ngân hàng
            </Form.Text>
          </Form.Group>

          <Button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: colors.primary,
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 600,
            }}
          >
            {saving ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Đang lưu...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Lưu thông tin
              </>
            )}
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default PaymentSettings;
