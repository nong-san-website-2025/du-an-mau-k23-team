
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import OrderTab from './OrderTab';

const Orders = () => {
  const location = useLocation();
  const [tab, setTab] = useState('pending');

  // Kiểm tra URL parameter để set tab mặc định
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['pending', 'completed', 'cancelled'].includes(tabParam)) {
      setTab(tabParam);
    }
  }, [location.search]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 0, borderRadius: 0 }}> 
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        <button
          onClick={() => setTab('pending')}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 0,
            border: tab === 'pending' ? '2px solid #27ae60' : '1px solid #fff',
            background: tab === 'pending' ? '#eafaf1' : '#f8f8f8',
            color: tab === 'pending' ? '#27ae60' : '#333',
            fontWeight: tab === 'pending' ? 'bold' : 'normal',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Chờ thanh toán
        </button>
        <button
          onClick={() => setTab('completed')}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 0,
            border: tab === 'completed' ? '2px solid #27ae60' : '1px solid #fff',
            background: tab === 'completed' ? '#eafaf1' : '#f8f8f8',
            color: tab === 'completed' ? '#27ae60' : '#333',
            fontWeight: tab === 'completed' ? 'bold' : 'normal',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Đã thanh toán
        </button>
        <button
          onClick={() => setTab('cancelled')}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 0,
            border: tab === 'cancelled' ? '2px solid #e74c3c' : '1px solid #fff',
            background: tab === 'cancelled' ? '#faeaea' : '#f8f8f8',
            color: tab === 'cancelled' ? '#e74c3c' : '#333',
            fontWeight: tab === 'cancelled' ? 'bold' : 'normal',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Đã huỷ
        </button>
      </div>
      <OrderTab status={tab} />
    </div>
  );
};

export default Orders;