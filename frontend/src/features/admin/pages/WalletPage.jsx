import React, { useState, useEffect } from "react";
import { Container, Card, Table, Button, Badge, Alert, Spinner, Modal, Form, Row, Col } from "react-bootstrap";
import { FaWallet, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaUsers, FaMoneyBillWave } from "react-icons/fa";
import walletApi from "../services/walletApi";

export default function WalletPage() {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Loading wallet data...');
      
      const [requestsData, statsData] = await Promise.all([
        walletApi.getAllWalletRequests(),
        walletApi.getWalletStats()
      ]);
      
      console.log('📋 Requests data:', requestsData);
      console.log('📊 Stats data:', statsData);
      
      const requests = Array.isArray(requestsData) ? requestsData : requestsData.results || [];
      console.log('✅ Processed requests:', requests);
      
      setPaymentRequests(requests);
      setStats(statsData);
    } catch (err) {
      console.error('❌ Error loading wallet data:', err);
      setError(`Có lỗi xảy ra khi tải dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, note = '') => {
    setProcessing(requestId);
    try {
      await walletApi.approveWalletRequest(requestId, note);
      
      // Cập nhật state local
      setPaymentRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved', admin_note: note }
            : req
        )
      );
      
      // Reload stats
      const statsData = await walletApi.getWalletStats();
      setStats(statsData);
      
      // Gửi sự kiện cập nhật ví
      const walletUpdateEvent = new CustomEvent('walletUpdated', {
        detail: { requestId, status: 'approved' }
      });
      window.dispatchEvent(walletUpdateEvent);
      
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Có lỗi xảy ra khi xác nhận!');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId, note = '') => {
    setProcessing(requestId);
    try {
      await walletApi.rejectWalletRequest(requestId, note);
      
      // Cập nhật state local
      setPaymentRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected', admin_note: note }
            : req
        )
      );
      
      // Reload stats
      const statsData = await walletApi.getWalletStats();
      setStats(statsData);
      
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Có lỗi xảy ra khi từ chối!');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning"><FaClock className="me-1" />Chờ xác nhận</Badge>;
      case 'approved':
        return <Badge bg="success"><FaCheckCircle className="me-1" />Đã xác nhận</Badge>;
      case 'rejected':
        return <Badge bg="danger"><FaTimesCircle className="me-1" />Đã từ chối</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: "#2E8B57" }} />
        <div className="mt-3" style={{ color: "#2E8B57", fontWeight: 600 }}>
          Đang tải danh sách yêu cầu...
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Có lỗi xảy ra</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={loadData}>
            Thử lại
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaClock className="text-warning mb-2" size={24} />
              <h5 className="text-warning">{stats.total_pending || 0}</h5>
              <small className="text-muted">Chờ xác nhận</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaCheckCircle className="text-success mb-2" size={24} />
              <h5 className="text-success">{stats.total_approved || 0}</h5>
              <small className="text-muted">Đã xác nhận</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaMoneyBillWave className="text-info mb-2" size={24} />
              <h5 className="text-info">
                {(stats.total_amount_pending || 0).toLocaleString('vi-VN')} ₫
              </h5>
              <small className="text-muted">Tổng tiền chờ</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <FaUsers className="text-primary mb-2" size={24} />
              <h5 className="text-primary">{stats.total_users_with_wallet || 0}</h5>
              <small className="text-muted">Người dùng có ví</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow border-0">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            <FaWallet className="me-2" />
            Quản lý Ví Điện Tử - Yêu cầu Nạp Tiền
          </h4>
        </Card.Header>
        <Card.Body>
          {paymentRequests.length === 0 ? (
            <Alert variant="info" className="text-center">
              <FaClock className="me-2" />
              Không có yêu cầu nạp tiền nào
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Số tiền</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paymentRequests.map((request, index) => (
                  <tr key={request.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div>
                        <strong>{request.user.full_name || request.user.username}</strong>
                        <br />
                        <small className="text-muted">@{request.user.username}</small>
                      </div>
                    </td>
                    <td>{request.user.email}</td>
                    <td>
                      <strong style={{ color: "#2E8B57" }}>
                        {request.amount.toLocaleString('vi-VN')} ₫
                      </strong>
                    </td>
                    <td>
                      <small>
                        {new Date(request.created_at).toLocaleString('vi-VN')}
                      </small>
                    </td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => viewDetails(request)}
                        >
                          <FaEye />
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleApprove(request.id)}
                              disabled={processing === request.id}
                            >
                              {processing === request.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <FaCheckCircle />
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleReject(request.id)}
                              disabled={processing === request.id}
                            >
                              {processing === request.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <FaTimesCircle />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal chi tiết */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết yêu cầu nạp tiền</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>ID yêu cầu:</strong> #{selectedRequest.id}
                </div>
                <div className="col-md-6">
                  <strong>Trạng thái:</strong> {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Người dùng:</strong> {selectedRequest.user.full_name || selectedRequest.user.username}
                </div>
                <div className="col-md-6">
                  <strong>Email:</strong> {selectedRequest.user.email}
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Số tiền:</strong> 
                  <span style={{ color: "#2E8B57", fontWeight: "bold", fontSize: "18px" }}>
                    {selectedRequest.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="col-md-6">
                  <strong>Thời gian tạo:</strong> {new Date(selectedRequest.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Mô tả:</strong>
                <div className="mt-2 p-3" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  {selectedRequest.message}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedRequest && selectedRequest.status === 'pending' && (
            <>
              <Form.Group className="me-3 flex-grow-1">
                <Form.Control
                  type="text"
                  placeholder="Ghi chú của admin (tùy chọn)"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </Form.Group>
              <Button
                variant="success"
                onClick={() => {
                  handleApprove(selectedRequest.id, adminNote);
                  setShowModal(false);
                  setAdminNote('');
                }}
                disabled={processing === selectedRequest.id}
              >
                <FaCheckCircle className="me-2" />
                Xác nhận
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleReject(selectedRequest.id, adminNote);
                  setShowModal(false);
                  setAdminNote('');
                }}
                disabled={processing === selectedRequest.id}
              >
                <FaTimesCircle className="me-2" />
                Từ chối
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => {
            setShowModal(false);
            setAdminNote('');
          }}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
