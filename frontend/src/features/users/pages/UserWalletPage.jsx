import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Badge, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FaWallet, FaPlus, FaClock, FaCheckCircle, FaTimesCircle, FaMoneyBillWave } from 'react-icons/fa';
import walletApi from '../../admin/services/walletApi';
import WalletRequestForm from '../components/WalletRequestForm';

const UserWalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [walletData, requestsData] = await Promise.all([
        walletApi.getUserWallet(),
        walletApi.getUserWalletRequests()
      ]);
      
      setWallet(walletData);
      setRequests(Array.isArray(requestsData) ? requestsData : requestsData.results || []);
    } catch (err) {
      console.error('Error loading wallet data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu ví');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = () => {
    loadWalletData(); // Reload data after successful request
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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: "#2E8B57" }} />
        <div className="mt-3" style={{ color: "#2E8B57", fontWeight: 600 }}>
          Đang tải thông tin ví...
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
          <Button variant="outline-danger" onClick={loadWalletData}>
            Thử lại
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Wallet Balance Card */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm bg-gradient" style={{ background: 'linear-gradient(135deg, #2E8B57, #3CB371)' }}>
            <Card.Body className="text-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1 opacity-75">Số dư ví của bạn</h6>
                  <h2 className="mb-0 fw-bold">
                    {wallet?.balance ? parseFloat(wallet.balance).toLocaleString('vi-VN') : '0'} ₫
                  </h2>
                </div>
                <FaWallet size={40} className="opacity-75" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center justify-content-center">
              <Button 
                variant="success" 
                size="lg"
                onClick={() => setShowRequestForm(true)}
                className="d-flex align-items-center"
              >
                <FaPlus className="me-2" />
                Yêu cầu nạp tiền
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Request History */}
      <Card className="shadow border-0">
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            <FaMoneyBillWave className="me-2 text-success" />
            Lịch sử yêu cầu nạp tiền
          </h5>
        </Card.Header>
        <Card.Body>
          {requests.length === 0 ? (
            <Alert variant="info" className="text-center mb-0">
              <FaClock className="me-2" />
              Bạn chưa có yêu cầu nạp tiền nào
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian tạo</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                  <tr key={request.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong style={{ color: "#2E8B57" }}>
                        {parseFloat(request.amount).toLocaleString('vi-VN')} ₫
                      </strong>
                    </td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <small>
                        {new Date(request.created_at).toLocaleString('vi-VN')}
                      </small>
                    </td>
                    <td>
                      <small className="text-muted">
                        {request.message || 'Không có ghi chú'}
                      </small>
                      {request.admin_note && (
                        <div className="mt-1">
                          <small className="text-info">
                            <strong>Admin:</strong> {request.admin_note}
                          </small>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Request Form Modal */}
      <WalletRequestForm
        show={showRequestForm}
        onHide={() => setShowRequestForm(false)}
        onSuccess={handleRequestSuccess}
      />
    </Container>
  );
};

export default UserWalletPage;