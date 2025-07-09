import { useState, useEffect, useRef } from "react";
import { FaFacebookMessenger } from "react-icons/fa";
import "../styles/ChatBox.css";
import { motion, AnimatePresence } from "framer-motion";

function ChatBox({ username, roomName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);
  const user = username || localStorage.getItem("username") || "Người dùng";
  const room = roomName || "public";
  const bottomRef = useRef(null);

  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  useEffect(() => {
    if (isOpen && !socketRef.current) {
      const room = username || "public";
      socketRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${room}/`);

      socketRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages((prev) => [...prev, { sender: data.sender, text: data.message }]);

        // Bot tự động trả lời sau khi nhận được tin nhắn từ người dùng
        if (data.sender === user) {
          setTimeout(() => {
            // setMessages((prev) => [...prev, { sender: "Hệ thống", text: "Cảm ơn bạn đã liên hệ, chúng tôi sẽ phản hồi sớm nhất!" }]);
          }, 1000);
        }
      };

      return () => socketRef.current && socketRef.current.close();
    }
  }, [isOpen, room, user]);

  const handleSend = () => {
    if (input.trim() === "" || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({
      message: input,
      sender: user
    }));

    setInput("");
  };

  return (
    <div className="chatbox-container">
      {!isOpen && (
        <div className="chat-icon" onClick={() => setIsOpen(true)}>
          <FaFacebookMessenger size={38} color="#fff" />
        </div>
      )}

      {isOpen && (
        <div className="chatbox-popup">
          <div className="chatbox-header">
            Hỗ trợ khách hàng
            <button className="chatbox-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chatbox-body">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`chatbox-message ${msg.sender === username ? "user" : "bot"}`}
                >
                  <b>{msg.sender === username ? "Tôi" : msg.sender}:</b> {msg.text}
                </motion.div>
              ))}
            
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          <div className="chatbox-input">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend}>Gửi</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBox;
