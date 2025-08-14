import React, { useEffect, useState } from "react";
import { Container, Card, Spinner, Button, ProgressBar, Alert, Badge, Modal, Table } from "react-bootstrap";
import { FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaWallet, FaHistory, FaBan } from "react-icons/fa";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../login_register/services/api";


const PaymentStatusPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending"); // "pending", "approved", "rejected"
  const [message, setMessage] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const amount = Number(searchParams.get("amount"));

  // Lấy thông tin user và role
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const userRes = await API.get('/users/me/');
        setCurrentUser(userRes.data);
        
        // Lấy role từ localStorage hoặc từ API response
        const role = localStorage.getItem('user_role') || userRes.data.role;
        setUserRole(role);
        
      } catch (err) {
        console.error('Error fetching user info:', err);
        navigate('/login');
      }
    }
    fetchUserInfo();
  }, [navigate]);

  // Khởi tạo payment request
  useEffect(() => {
    if (amount && !isNaN(amount) && currentUser) {
      const request = {
        id: Date.now(), // Tạm thời dùng timestamp làm ID
        amount: amount,
        user: currentUser,
        status: 'pending',
        created_at: new Date().toISOString(),
        message: `Yêu cầu nạp ${amount.toLocaleString('vi-VN')} ₫ vào ví`
      };
      setPaymentRequest(request);
      setMessage(request.message);
      setLoading(false);
    }
  }, [amount, currentUser]);

  // Lấy lịch sử giao dịch
  const fetchTransactionHistory = async () => {
    try {
      // Lấy từ localStorage trước
      const savedHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
      
      // Nếu chưa có lịch sử, tạo một số dữ liệu mẫu
      if (savedHistory.length === 0) {
        const mockHistory = [
          {
            id: 1,
            amount: 50000,
            type: 'recharge',
            status: 'approved',
            created_at: '2024-01-15T10:30:00Z',
            description: 'Nạp tiền vào ví - Đã được admin xác nhận'
          },
          {
            id: 2,
            amount: 100000,
            type: 'recharge',
            status: 'approved',
            created_at: '2024-01-10T14:20:00Z',
            description: 'Nạp tiền vào ví - Đã được admin xác nhận'
          },
          {
            id: 3,
            amount: 30000,
            type: 'recharge',
            status: 'rejected',
            created_at: '2024-01-05T09:15:00Z',
            description: 'Nạp tiền vào ví - Đã bị admin từ chối'
          }
        ];
        localStorage.setItem('transactionHistory', JSON.stringify(mockHistory));
        setTransactionHistory(mockHistory);
      } else {
        setTransactionHistory(savedHistory);
      }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
    }
  };

  // Load lịch sử giao dịch khi component mount
  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  // Xử lý xác nhận thanh toán (chỉ admin)
  const handleApprovePayment = async () => {
    if (userRole !== 'admin') {
      alert('Chỉ admin mới có thể xác nhận thanh toán!');
      return;
    }
    
    setConfirmLoading(true);
    try {
      // Gọi API nạp tiền
      await API.post("/users/wallet/recharge/", { 
        amount: paymentRequest.amount,
        user_id: paymentRequest.user.id 
      });
      
      // Lấy lại số dư ví từ backend
      const res = await API.get("/users/wallet/");
      setWalletBalance(res.data.balance);
      
      // Lưu vào lịch sử giao dịch
      const newTransaction = {
        id: Date.now(),
        amount: paymentRequest.amount,
        type: 'recharge',
        status: 'approved',
        created_at: new Date().toISOString(),
        description: 'Nạp tiền vào ví - Đã được admin xác nhận'
      };
      
      // Lưu vào localStorage để giữ lịch sử
      const existingHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
      const updatedHistory = [newTransaction, ...existingHistory];
      localStorage.setItem('transactionHistory', JSON.stringify(updatedHistory));
      setTransactionHistory(updatedHistory);
      
      // Gửi sự kiện cập nhật ví để ProfilePage có thể lắng nghe
      const walletUpdateEvent = new CustomEvent('walletUpdated', {
        detail: { newBalance: res.data.balance }
      });
      window.dispatchEvent(walletUpdateEvent);
      
      setStatus("approved");
      setMessage("Thanh toán đã được xác nhận và số dư đã được cập nhật!");
      
    } catch (err) {
      console.error('Error approving payment:', err);
      setMessage("Có lỗi xảy ra khi xác nhận thanh toán!");
    } finally {
      setConfirmLoading(false);
    }
  };

  // Xử lý từ chối thanh toán (chỉ admin)
  const handleRejectPayment = async () => {
    if (userRole !== 'admin') {
      alert('Chỉ admin mới có thể từ chối thanh toán!');
      return;
    }
    
    setConfirmLoading(true);
    try {
      // Lưu vào lịch sử giao dịch
      const newTransaction = {
        id: Date.now(),
        amount: paymentRequest.amount,
        type: 'recharge',
        status: 'rejected',
        created_at: new Date().toISOString(),
        description: 'Nạp tiền vào ví - Đã bị admin từ chối'
      };
      
      // Lưu vào localStorage
      const existingHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
      const updatedHistory = [newTransaction, ...existingHistory];
      localStorage.setItem('transactionHistory', JSON.stringify(updatedHistory));
      setTransactionHistory(updatedHistory);
      
      setStatus("rejected");
      setMessage("Yêu cầu thanh toán đã bị từ chối!");
    } catch (err) {
      console.error('Error rejecting payment:', err);
    } finally {
      setConfirmLoading(false);
    }
  };

  // Xử lý hủy yêu cầu thanh toán (người dùng)
  const handleCancelPayment = async () => {
    if (status !== 'pending') {
      alert('Chỉ có thể hủy yêu cầu đang chờ xử lý!');
      return;
    }
    
    const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy yêu cầu thanh toán này?');
    if (!confirmCancel) return;
    
    setCancelLoading(true);
    try {
      // Lưu vào lịch sử giao dịch
      const newTransaction = {
        id: Date.now(),
        amount: paymentRequest.amount,
        type: 'recharge',
        status: 'cancelled',
        created_at: new Date().toISOString(),
        description: 'Nạp tiền vào ví - Đã bị người dùng hủy'
      };
      
      // Lưu vào localStorage
      const existingHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
      const updatedHistory = [newTransaction, ...existingHistory];
      localStorage.setItem('transactionHistory', JSON.stringify(updatedHistory));
      setTransactionHistory(updatedHistory);
      
      setStatus("cancelled");
      setMessage("Yêu cầu thanh toán đã được hủy!");
    } catch (err) {
      console.error('Error cancelling payment:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  // Render thanh trạng thái
  const renderStatusBar = () => {
    const steps = [
      { key: 'pending', label: 'Chờ xác nhận', icon: FaClock },
      { key: 'approved', label: 'Đã xác nhận', icon: FaCheckCircle },
    ];

    const currentStepIndex = steps.findIndex(step => step.key === status);
    const progress = (status === 'rejected' || status === 'cancelled') ? 0 : ((currentStepIndex + 1) / steps.length) * 100;

    return (
      <div className="mb-4">
        <h5 className="mb-3" style={{ color: "#2E8B57", fontWeight: 600 }}>
          Trạng thái thanh toán
        </h5>
        <ProgressBar 
          now={progress} 
          variant={
            status === 'rejected' ? 'danger' : 
            status === 'cancelled' ? 'warning' : 
            'success'
          }
          style={{ height: '8px', marginBottom: '16px' }}
        />
        <div className="d-flex justify-content-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index <= currentStepIndex;
            const isRejected = status === 'rejected';
            const isCancelled = status === 'cancelled';
            
            return (
              <div key={step.key} className="text-center">
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center mb-2`}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 
                      isRejected ? '#D32F2F' : 
                      isCancelled ? '#FF9800' : 
                      (isActive ? '#2E8B57' : '#e0e0e0'),
                    color: (isActive || isRejected || isCancelled) ? 'white' : '#666',
                    margin: '0 auto'
                  }}
                >
                  <StepIcon size={16} />
                </div>
                <small 
                  style={{ 
                    color: 
                      isRejected ? '#D32F2F' : 
                      isCancelled ? '#FF9800' : 
                      (isActive ? '#2E8B57' : '#666'),
                    fontWeight: isActive ? 600 : 400
                  }}
                >
                  {step.label}
                </small>
              </div>
            );
          })}
        </div>
        
        {/* Hiển thị trạng thái đặc biệt */}
        {(status === 'rejected' || status === 'cancelled') && (
          <div className="text-center mt-3">
            <Badge 
              bg={status === 'rejected' ? 'danger' : 'warning'} 
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              {status === 'rejected' && <><FaTimesCircle className="me-2" />Đã từ chối</>}
              {status === 'cancelled' && <><FaBan className="me-2" />Đã hủy</>}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: "#2E8B57" }} />
        <div className="mt-3" style={{ color: "#2E8B57", fontWeight: 600 }}>
          Đang kiểm tra trạng thái thanh toán...
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow border-0 p-4 mb-4" style={{ background: "#fff" }}>
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ color: "#2E8B57" }}>
            <FaWallet className="me-2" />
            Xác nhận nạp tiền
          </h2>
        </div>

        {/* Thanh trạng thái */}
        {renderStatusBar()}

        {/* Thông tin yêu cầu */}
        {paymentRequest && (
          <Card className="mb-4" style={{ backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}>
            <Card.Body>
              <h5 style={{ color: "#2E8B57", marginBottom: "16px" }}>
                <FaUser className="me-2" />
                Thông tin yêu cầu
              </h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Người yêu cầu:</strong> {paymentRequest.user.full_name || paymentRequest.user.username}</p>
                  <p><strong>Email:</strong> {paymentRequest.user.email}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Số tiền:</strong> 
                    <Badge bg="primary" className="ms-2" style={{ fontSize: "14px" }}>
                      {paymentRequest.amount.toLocaleString('vi-VN')} ₫
                    </Badge>
                  </p>
                  <p><strong>Thời gian:</strong> {new Date(paymentRequest.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Thông báo trạng thái */}
        <Alert 
          variant={
            status === 'approved' ? 'success' : 
            status === 'rejected' ? 'danger' : 
            status === 'cancelled' ? 'warning' :
            'info'
          }
          className="text-center"
        >
          <div style={{ fontSize: "18px", fontWeight: 600 }}>
            {status === 'pending' && <FaClock className="me-2" />}
            {status === 'approved' && <FaCheckCircle className="me-2" />}
            {status === 'rejected' && <FaTimesCircle className="me-2" />}
            {status === 'cancelled' && <FaBan className="me-2" />}
            {message}
          </div>
          
          {status === 'approved' && walletBalance !== null && (
            <div className="mt-2" style={{ fontSize: "16px" }}>
              Số dư ví hiện tại: <strong>{walletBalance.toLocaleString("vi-VN")} ₫</strong>
            </div>
          )}
        </Alert>

        {/* Nút hành động */}
        <div className="text-center">
          {status === 'pending' && userRole === 'admin' && (
            <div className="d-flex justify-content-center gap-3 mb-3">
              <Button
                variant="success"
                onClick={handleApprovePayment}
                disabled={confirmLoading}
                style={{
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: "12px 24px"
                }}
              >
                {confirmLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="me-2" />
                    Xác nhận thanh toán
                  </>
                )}
              </Button>
              
              <Button
                variant="danger"
                onClick={handleRejectPayment}
                disabled={confirmLoading}
                style={{
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: "12px 24px"
                }}
              >
                <FaTimesCircle className="me-2" />
                Từ chối
              </Button>
            </div>
          )}

          {status === 'pending' && userRole !== 'admin' && (
            <>
              <Alert variant="warning" className="mt-3">
                <FaClock className="me-2" />
                Yêu cầu của bạn đang chờ admin xác nhận. Vui lòng đợi...
              </Alert>
              
              {/* Nút hủy yêu cầu cho người dùng */}
              <Button
                variant="outline-danger"
                onClick={handleCancelPayment}
                disabled={cancelLoading}
                style={{
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: "10px 20px",
                  marginTop: 10
                }}
              >
                {cancelLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Đang hủy...
                  </>
                ) : (
                  <>
                    <FaBan className="me-2" />
                    Hủy yêu cầu
                  </>
                )}
              </Button>
            </>
          )}

          {/* Nút xem lịch sử giao dịch */}
          <div className="mt-3">
            <Button
              variant="outline-info"
              onClick={() => {
                fetchTransactionHistory();
                setShowHistory(true);
              }}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                padding: "10px 20px",
                marginRight: 10
              }}
            >
              <FaHistory className="me-2" />
              Xem lịch sử giao dịch
            </Button>

            {(status === 'approved' || status === 'rejected' || status === 'cancelled') && (
              <Button
                onClick={() => navigate('/profile')}
                style={{
                  background: 
                    status === 'approved' ? "#2E8B57" : 
                    status === 'cancelled' ? "#FF9800" : 
                    "#D32F2F",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: "10px 20px",
                }}
              >
                Về trang cá nhân
              </Button>
            )}
          </div>
        </div>

        {/* Thông tin admin */}
        {userRole === 'admin' && (
          <Alert variant="info" className="mt-4">
            <strong>Quyền Admin:</strong> Bạn có thể xác nhận hoặc từ chối các yêu cầu nạp tiền.
          </Alert>
        )}
      </Card>

      {/* Modal lịch sử giao dịch */}
      <Modal show={showHistory} onHide={() => setShowHistory(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: "#2E8B57" }}>
            <FaHistory className="me-2" />
            Lịch sử giao dịch
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {transactionHistory.length === 0 ? (
            <div className="text-center py-4">
              <FaWallet size={48} style={{ color: "#ccc", marginBottom: 16 }} />
              <p style={{ color: "#666" }}>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>
                  <th>Thời gian</th>
                  <th>Loại giao dịch</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map((transaction) => (
                  <tr key={transaction.id}>
                    <td style={{ fontSize: "14px" }}>
                      {new Date(transaction.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <Badge bg="info" style={{ fontSize: "12px" }}>
                        {transaction.type === 'recharge' ? 'Nạp tiền' : 'Khác'}
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 600, color: "#2E8B57" }}>
                      +{transaction.amount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td>
                      <Badge 
                        bg={
                          transaction.status === 'approved' ? 'success' :
                          transaction.status === 'rejected' ? 'danger' :
                          transaction.status === 'cancelled' ? 'warning' :
                          'secondary'
                        }
                        style={{ fontSize: "12px" }}
                      >
                        {transaction.status === 'approved' && 'Thành công'}
                        {transaction.status === 'rejected' && 'Từ chối'}
                        {transaction.status === 'cancelled' && 'Đã hủy'}
                        {transaction.status === 'pending' && 'Chờ xử lý'}
                      </Badge>
                    </td>
                    <td style={{ fontSize: "14px", color: "#666" }}>
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowHistory(false)}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PaymentStatusPage;
