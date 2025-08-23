const API_URL = process.env.REACT_APP_API_URL;


const adminApi = {
  getDashboardStats: async () => {
    return {};
  },

  getUsers: async () => {
    return [];
  },

  getShops: async () => {
    return [];
  },

  getProducts: async () => {
    return [];
  },

  getOrders: async (params = {}) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      if (params.status) queryParams.append("status", params.status);
      if (params.search) queryParams.append("search", params.search);

      const response = await fetch(`${API_URL}/orders/admin-list/?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  },

  getOrderDetail: async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/orders/${orderId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order detail");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching order detail:", error);
      throw error;
    }
  },

  getComplaints: async () => [],
  getVouchers: async () => [],
  getWallets: async () => [],
  getBanners: async () => [],
  getNotifications: async () => [],
  getStaff: async () => [],
  getReports: async () => [],
};

export default adminApi;
