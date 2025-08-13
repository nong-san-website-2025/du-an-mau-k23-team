import API from "../../login_register/services/api";

const walletApi = {
  // Admin APIs - chỉ admin mới có thể gọi
  getAllWalletRequests: async () => {
    try {
      const response = await API.get('/wallet/requests/');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet requests:', error);
      throw error;
    }
  },

  approveWalletRequest: async (requestId, adminNote = '') => {
    try {
      const response = await API.post(`/wallet/requests/${requestId}/approve/`, {
        admin_note: adminNote
      });
      return response.data;
    } catch (error) {
      console.error('Error approving wallet request:', error);
      throw error;
    }
  },

  rejectWalletRequest: async (requestId, adminNote = '') => {
    try {
      const response = await API.post(`/wallet/requests/${requestId}/reject/`, {
        admin_note: adminNote
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting wallet request:', error);
      throw error;
    }
  },

  getWalletStats: async () => {
    try {
      const response = await API.get('/wallet/admin/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      throw error;
    }
  },

  // User APIs - user có thể gọi
  createWalletRequest: async (amount, message = '') => {
    try {
      const response = await API.post('/wallet/requests/', {
        amount,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error creating wallet request:', error);
      throw error;
    }
  },

  getUserWalletRequests: async () => {
    try {
      const response = await API.get('/wallet/requests/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user wallet requests:', error);
      throw error;
    }
  },

  getUserWallet: async () => {
    try {
      const response = await API.get('/wallet/my-wallet/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user wallet:', error);
      throw error;
    }
  }
};

export default walletApi;