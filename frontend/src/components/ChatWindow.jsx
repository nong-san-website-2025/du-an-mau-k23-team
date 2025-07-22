import { useState, useEffect, useRef } from "react";
import "../styles/SellerChat.css"; // dùng chung
import { motion, AnimatePresence } from "framer-motion";
import VideoCall from "./VideoCall";
function formatTime(timestamp) {
  if (!timestamp) return ""; // nếu không có timestamp thì trả chuỗi rỗng
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return ""; // kiểm tra hợp lệ
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function ChatWindow({ username, roomName, setIsCalling, isCalling }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  // const [isCalling, setIsCalling] = useState(false);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socketRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);
    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const newMsg = { sender: data.sender, text: data.message,  timestamp: data.timestamp || new Date().toISOString(),};

      setMessages((prev) => {
        const updated = [...prev, newMsg];

        // Lưu vào localStorage theo từng room
        const saved = localStorage.getItem("chat_history");
        const history = saved ? JSON.parse(saved) : {};
        history[roomName] = updated;
        localStorage.setItem("chat_history", JSON.stringify(history));

        return updated;
      });
        if (data.type === "call_offer") {
          setIsCalling(true); // hiển thị video call
          setTimeout(() => {
            socketRef.current._call?.handleAnswer(data.offer);
          }, 300);
        }
        if (data.type === "call_answer") {
          socketRef.current._call?.handleReceiveAnswer(data.answer);
        }
        if (data.type === "ice_candidate") {
          socketRef.current._call?.handleAddCandidate(data.candidate);
        }
      };
    return () => socketRef.current && socketRef.current.close();
  }, [roomName]);

  const handleSend = () => {
  if (input.trim() === "" || !socketRef.current) return;

  const newMsg = { sender: username, text: input,  timestamp: new Date().toISOString(),};

  socketRef.current.send(JSON.stringify({
    message: input,
    sender: username
  }));

  // setMessages((prev) => {
  //   const updated = [...prev, newMsg];

  //   // Cập nhật localStorage
  //   const saved = localStorage.getItem("chat_history");
  //   const history = saved ? JSON.parse(saved) : {};
  //   history[roomName] = updated;
  //   localStorage.setItem("chat_history", JSON.stringify(history));

  //   return updated;
  // });

  setInput("");
};

  useEffect(() => {
  // ✅ Làm mới khung chat trước
  setMessages([]);

  const saved = localStorage.getItem("chat_history");
  if (saved) {
    const history = JSON.parse(saved);
    if (history[roomName]) {
      setMessages(history[roomName]);
    }
  }
}, [roomName]);

  
  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <span>{roomName}</span>
        
      </div>

      <div className="chat-window-body">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`message ${msg.sender === username ? "user" : "other"}`}
            >
              <div className="message-content">
                <b>{msg.sender === username ? "Tôi" : msg.sender}:</b> {msg.text}
              </div>
              <div className="message-time">{formatTime(msg.timestamp)}</div> {/* ✅ HIỂN THỊ GIỜ */}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      
      <div className="chat-window-input">
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Gửi</button>
      </div>
      {isCalling && (
        <VideoCall
          socketRef={socketRef}
          isCaller={false} // Seller là người nhận
          onEndCall={() => setIsCalling(false)}
        />
      )}
      
    </div>
    
  );
  
}

export default ChatWindow;
