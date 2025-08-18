import React, { useState, useEffect } from 'react';
import { Alert, Badge } from 'react-bootstrap';
import { FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import API from '../../login_register/services/api';

const WalletNotifications = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await API.get('/wallet/my-topup-requests/');
      setPendingRequests(response.data.filter(req => req.status === 'pending'));
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    // Refresh every 60 seconds
    const interval = setInterval(fetchPendingRequests, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      {pendingRequests.map((request) => (
        <Alert key={request.id} variant="info" className="mb-2" style={{ borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaClock style={{ color: "#17a2b8" }} />
            <span>
              Yêu cầu nạp tiền <strong>{request.amount.toLocaleString('vi-VN')} ₫</strong> đang chờ xét duyệt
            </span>
            <Badge bg="warning" className="ms-auto">
              Chờ duyệt
            </Badge>
          </div>
          <small className="text-muted d-block mt-1">
            Gửi lúc: {new Date(request.created_at).toLocaleString('vi-VN')}
          </small>
        </Alert>
      ))}
    </div>
  );
};

export default WalletNotifications;