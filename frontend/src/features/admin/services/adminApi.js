const API_URL = process.env.REACT_APP_API_URL;


const adminApi = {
  getDashboardStats: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/dashboard/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
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
      if (params.start_date) queryParams.append("start_date", params.start_date);
      if (params.end_date) queryParams.append("end_date", params.end_date);
      if (params.page) queryParams.append("page", params.page);
      if (params.page_size) queryParams.append("page_size", params.page_size);

      // ✅ Sửa endpoint từ /orders/admin-list/ → /orders/admin-list/
      const response = await fetch(`${API_URL}/orders/admin-list/?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`API Error: ${response.status}`, text);
        throw new Error(`Failed to fetch orders: ${response.status} ${text}`);
      }

      const data = await response.json();
      
      // Debug: log response shape for admin orders to help diagnose missing pending items
      try {
        // eslint-disable-next-line no-console
        console.debug('[adminApi.getOrders] params:', Object.fromEntries(queryParams.entries()), 'responseKeys:', Object.keys(data), 'count:', data.count ?? (Array.isArray(data) ? data.length : undefined));
      } catch (e) {
        // ignore
      }

      // Handle both DRF pagination format and direct array
      if (data.results !== undefined) {
        // DRF format: { results: [...], count: 123, next: ..., previous: ... }
        return {
          orders: data.results || [],
          total: data.count || 0
        };
      } else if (Array.isArray(data)) {
        // Direct array format
        return {
          orders: data,
          total: data.length
        };
      } else {
        // Assume single object or unknown format
        console.warn("Unexpected API response format:", data);
        return {
          orders: Array.isArray(data) ? data : [],
          total: 0
        };
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
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
