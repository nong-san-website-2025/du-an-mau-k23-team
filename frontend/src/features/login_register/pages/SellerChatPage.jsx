import { useNavigate } from "react-router-dom";
import SellerChat from "../components/SellerChat";
import "../styles/SellerChatPage.css";

function SellerChatPage() {
  const navigate = useNavigate();

  return (
    <div className="seller-chat-page full-screen">
      <div className="chat-header">
        <h2>Quản lý trò chuyện</h2>
        <button onClick={() => navigate("/seller-dashboard")}>Về trang quản lý cửa hàng</button>
      </div>

      <div className="chat-body-wrapper">
        <SellerChat />
      </div>
    </div>
  );
}

export default SellerChatPage;
