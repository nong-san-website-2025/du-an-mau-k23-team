// API service stub for admin features
const adminApi = {
  getDashboardStats: async () => {
    // Call backend API for dashboard stats
    return {};
  },
  getUsers: async () => {
    // Call backend API for users
    return [];
  },
  getShops: async () => {
    // Call backend API for shops
    return [];
  },
  getProducts: async () => {
    // Call backend API for products
    return [];
  },
  getOrders: async (params = {}) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await fetch(`http://localhost:8000/api/orders/admin-list/?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },



  getOrderDetail: async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/orders/${orderId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order detail');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching order detail:', error);
      throw error;
    }
  },
  getComplaints: async () => {
    // Call backend API for complaints
    return [];
  },
  getVouchers: async () => {
    // Call backend API for vouchers
    return [];
  },
  getWallets: async () => {
    // Call backend API for wallets
    return [];
  },
  getBanners: async () => {
    // Call backend API for banners
    return [];
  },
  getNotifications: async () => {
    // Call backend API for notifications
    return [];
  },
  getStaff: async () => {
    // Call backend API for staff
    return [];
  },
  getReports: async () => {
    // Call backend API for reports
    return [];
  },
};

export default adminApi;
