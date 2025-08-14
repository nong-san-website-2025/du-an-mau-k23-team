import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaWallet, FaMoneyBillWave } from 'react-icons/fa';
import walletApi from '../../admin/services/walletApi';

const WalletRequestForm = ({ show, onHide, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (parseFloat(amount) > 10000000) {
      setError('Số tiền không được vượt quá 10,000,000 ₫');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await walletApi.createWalletRequest(parseFloat(amount), message);
      
      // Reset form
      setAmount('');
      setMessage('');
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal
      onHide();
      
    } catch (err) {
      console.error('Error creating wallet request:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo yêu cầu nạp tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setMessage('');
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaWallet className="me-2 text-success" />
          Yêu cầu nạp tiền vào ví
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>
              <FaMoneyBillWave className="me-2" />
              Số tiền cần nạp (₫) *
            </Form.Label>
            <Form.Control
              type="number"
              placeholder="Nhập số tiền..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              max="10000000"
              step="1000"
              required
            />
            <Form.Text className="text-muted">
              Số tiền tối thiểu: 1,000 ₫ - Tối đa: 10,000,000 ₫
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ghi chú (tùy chọn)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Nhập ghi chú về yêu cầu nạp tiền..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {message.length}/500 ký tự
            </Form.Text>
          </Form.Group>

          <Alert variant="info" className="mb-0">
            <small>
              <strong>Lưu ý:</strong> Yêu cầu nạp tiền sẽ được gửi đến admin để xem xét và xác nhận. 
              Bạn sẽ nhận được thông báo khi yêu cầu được xử lý.
            </small>
          </Alert>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={loading || !amount}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang gửi...
              </>
            ) : (
              <>
                <FaWallet className="me-2" />
                Gửi yêu cầu
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default WalletRequestForm;