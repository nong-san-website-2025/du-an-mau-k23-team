// src/components/SSEConnectionHandler.jsx (hoặc viết trực tiếp trong App.js)
import { useEffect } from "react";
import { useAuth } from "../features/login_register/services/AuthContext"; // Import hook useAuth từ file bạn gửi
import sseManager from "../utils/sseService"; // Import class SSEManager

const SSEConnectionHandler = () => {
  const { user } = useAuth(); 

  useEffect(() => {
    // Lưu ý: Đảm bảo API /users/me/ của bạn trả về field 'id' trong object user
    if (user && user.isAuthenticated && user.id) {
      console.log(`[App] User ${user.id} logged in. Connecting SSE...`);
      sseManager.connect(user.id);
    } else {
      // Khi user null hoặc logout -> ngắt kết nối
      sseManager.disconnect();
    }

    // Cleanup: Ngắt kết nối khi component này bị hủy (tắt tab/app)
    return () => {
      sseManager.disconnect();
    };
  }, [user]); // Chạy lại mỗi khi biến 'user' thay đổi

  return null; // Component này không hiển thị giao diện
};

export default SSEConnectionHandler;