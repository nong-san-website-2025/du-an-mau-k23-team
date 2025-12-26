import React, { useState } from 'react';
import { Card, Button, Space, Tag, Row, Col, Spin, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

/**
 * ✅ AdminDiagnostic - Diagnostic tool để kiểm tra health của admin APIs
 */
const AdminDiagnostic = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');

  const endpoints = [
    { name: 'Health Check', url: `${API_URL?.replace('/api', '')}/api/health/` },
    { name: 'Dashboard', url: `${API_URL}/dashboard/` },
    { name: 'Orders Admin List', url: `${API_URL}/orders/admin-list/?page=1&page_size=5` },
    { name: 'Users List', url: `${API_URL}/users/list/?page=1&page_size=5` },
    { name: 'Roles List', url: `${API_URL}/users/roles/` },
  ];

  const checkEndpoint = async (endpoint) => {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        status: response.status,
        ok: response.ok,
        headers: {
          contentType: response.headers.get('content-type'),
        },
        data: response.ok ? await response.json() : await response.text(),
      };
    } catch (error) {
      return {
        status: 'error',
        ok: false,
        error: error.message,
      };
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    const newResults = {};

    for (const endpoint of endpoints) {
      newResults[endpoint.name] = await checkEndpoint(endpoint);
    }

    setResults(newResults);
    setLoading(false);
  };

  return (
    <Card title="🔧 Admin API Diagnostic" style={{ margin: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message="Diagnostic Tool"
          description="Click 'Run Diagnostics' to check if all admin APIs are working correctly"
          type="info"
        />

        <Button type="primary" onClick={runDiagnostics} loading={loading} size="large">
          🔍 Run Diagnostics
        </Button>

        {Object.keys(results).length > 0 && (
          <div>
            <h3>Results:</h3>
            {endpoints.map((endpoint) => {
              const result = results[endpoint.name];
              const isOk = result?.ok;

              return (
                <Card key={endpoint.name} style={{ marginBottom: 12, opacity: isOk ? 1 : 0.7 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        {isOk ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                        )}
                        <strong>{endpoint.name}</strong>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color={isOk ? 'green' : 'red'}>
                        {result?.status || 'Error'}
                      </Tag>
                    </Col>
                  </Row>

                  {!isOk && result?.error && (
                    <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>
                      Error: {result.error}
                    </div>
                  )}

                  {result?.data && (
                    <div style={{ marginTop: 8, background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                      <pre>{typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default AdminDiagnostic;
