import { useState } from 'react';
import { login } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import "./../styles/LoginForm.css";
import loginIcon from '../assets/login.png';
import homeIcon from '../assets/homefarm.png';
import logo from '../assets/log.png';


function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // State cho Đăng ký
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState(''); 
  const [isSeller, setIsSeller] = useState(false);
  // State cho Quên mật khẩu
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);

    if (result.success) {
      alert('Đăng nhập thành công!');
      navigate('/');
      // Chuyển hướng hoặc set state phù hợp
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async () => {
    if (!regUsername || !regEmail || !regPassword || !regPassword2) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      const response = await fetch('/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          password2: regPassword2,
          is_seller: isSeller
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Đăng ký thành công!');
        setShowRegisterModal(false);
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
        setRegPassword2('');
        setIsSeller(false);
      } else {
        // Hiển thị lỗi chi tiết từ backend
        alert(data && typeof data === 'object' ? JSON.stringify(data) : (data.error || 'Đăng ký thất bại!'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleForgotPassword = () => {
    if (!forgotEmail) {
      alert('Vui lòng nhập email!');
      return; 
    }
    // Bạn có thể thay đoạn dưới bằng gọi API thực tế
    alert(`Đã gửi email khôi phục tới: ${forgotEmail}`);
    setShowForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div className="login-container">
      
      <div className="login-page login-right">
      <form onSubmit={handleSubmit} className="login-form">
        <img src={logo} alt="Logo" className="login-logo" />
        <h2>
          <img src={loginIcon} alt="icon" className="login-icon" />
          Đăng nhập
          </h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit" className="login-btn">
          <img src={homeIcon} alt="icon" className="login-icon home-icon"/>
          Đăng nhập
          </button>
        <div className="extra-options">
          <button
            type="button"
            className="register-btn"
            onClick={() => setShowRegisterModal(true)}
          >
            Đăng ký
          </button>
          <span
            className="forgot-link"
            onClick={() => setShowForgotModal(true)}
          >
            Quên mật khẩu?
          </span>
        </div>
      </form>
      {/* Modal Đăng ký */}
      {showRegisterModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Đăng ký tài khoản</h3>
      <input
        type="text"
        placeholder="Tên đăng nhập"
        value={regUsername}
        onChange={(e) => setRegUsername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={regEmail}
        onChange={(e) => setRegEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mật khẩu"
        value={regPassword}
        onChange={(e) => setRegPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Nhập lại mật khẩu"
        value={regPassword2}
        onChange={(e) => setRegPassword2(e.target.value)}
      />

      <div style={{ margin: '10px 0' }}>
        <label>
          <input
            type="checkbox"
            checked={isSeller}
            onChange={(e) => setIsSeller(e.target.checked)}
          />
          Tôi là người bán
        </label>
      </div>

      <button onClick={handleRegister}>Đăng ký</button>
      <button className="close-btn" onClick={() => setShowRegisterModal(false)}>
        Đóng
      </button>
    </div>
  </div>
)}
      {/* Modal Quên mật khẩu */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Quên mật khẩu</h3>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <button onClick={handleForgotPassword}>Gửi yêu cầu</button>
            <button className="close-btn" onClick={() => setShowForgotModal(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
    
    
  );
}

export default LoginForm;
