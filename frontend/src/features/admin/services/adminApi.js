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
        const text = await response.text();
        throw new Error(`Failed to fetch orders: ${response.status} ${text}`);
      }

      const data = await response.json();
      // Ensure shop_name/phone exist at order level (fallback from first item)
      return (Array.isArray(data) ? data : []).map((o) => {
        if (!o.shop_name || !o.shop_phone) {
          const fi = (o.items || [])[0];
          if (fi) {
            o.shop_name = o.shop_name || fi.seller_name;
            o.shop_phone = o.shop_phone || fi.seller_phone;
          }
        }
        return o;
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Propagate error so UI can show message instead of silently returning []
      throw error;
    }
  },

  getOrderDetail: async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/orders/${orderId}/admin-detail/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch order detail: ${response.status} ${text}`);
      }

      const o = await response.json();
      if (!o.shop_name || !o.shop_phone) {
        const fi = (o.items || [])[0];
        if (fi) {
          o.shop_name = o.shop_name || fi.seller_name;
          o.shop_phone = o.shop_phone || fi.seller_phone;
        }
      }
      return o;
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
