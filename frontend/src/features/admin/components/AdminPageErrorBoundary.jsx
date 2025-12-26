import React from 'react';
import { Result, Button } from 'antd';

/**
 * ✅ AdminPageErrorBoundary - Wrapper để catch errors từ admin pages
 * Usage: <AdminPageErrorBoundary><YourAdminPage /></AdminPageErrorBoundary>
 */
class AdminPageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Admin Page Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Lỗi trang"
          subTitle={this.state.error?.message || 'Đã xảy ra lỗi không mong muốn'}
          extra={
            <Button
              type="primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Làm mới trang
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default AdminPageErrorBoundary;
