import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Container, Alert } from 'react-bootstrap';

const AdminRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const checkAdminAccess = () => {
      try {
        const token = localStorage.getItem('access_token');
        const userRole = localStorage.getItem('user_role');
        
        if (!token) {
          setError('Bạn cần đăng nhập để truy cập trang này');
          setIsLoading(false);
          return;
        }

        // Kiểm tra role từ localStorage
        if (userRole !== 'admin') {
          setError('Bạn không có quyền truy cập trang quản trị');
          setIsLoading(false);
          return;
        }

        // Verify với server (optional - có thể bỏ comment để test)
        // verifyAdminWithServer(token);
        
        // Tạm thời chỉ check localStorage
        setIsAdmin(true);
        setIsLoading(false);
        
      } catch (err) {
        console.error('Error checking admin access:', err);
        setError('Có lỗi xảy ra khi kiểm tra quyền truy cập');
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [location]);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: "#2E8B57" }} />
        <div className="mt-3" style={{ color: "#2E8B57", fontWeight: 600 }}>
          Đang kiểm tra quyền truy cập...
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h4>Truy cập bị từ chối</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            <a href="/login" className="btn btn-primary">
              Đăng nhập
            </a>
          </p>
        </Alert>
      </Container>
    );
  }

  if (!isAdmin) {
    // Redirect về trang chủ nếu không phải admin
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default AdminRoute;