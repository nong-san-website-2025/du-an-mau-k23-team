// Test script để kiểm tra wallet API từ frontend
import API from './features/login_register/services/api';

const testWalletAPI = async () => {
  try {
    console.log('🧪 Testing Wallet API from Frontend...');
    
    // Test 1: Login admin
    console.log('1. Login admin...');
    const loginResponse = await API.post('/users/login/', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.access) {
      localStorage.setItem('token', loginResponse.data.access);
      localStorage.setItem('user_role', loginResponse.data.role);
      console.log('✅ Admin login successful');
      
      // Test 2: Get wallet requests
      console.log('2. Get wallet requests...');
      const requestsResponse = await API.get('/wallet/requests/');
      console.log('✅ Wallet requests:', requestsResponse.data);
      
      // Test 3: Get wallet stats
      console.log('3. Get wallet stats...');
      const statsResponse = await API.get('/wallet/admin/stats/');
      console.log('✅ Wallet stats:', statsResponse.data);
      
    } else {
      console.error('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Uncomment to run test
// testWalletAPI();

export default testWalletAPI;