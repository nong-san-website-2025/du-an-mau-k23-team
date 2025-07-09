import { useState, useEffect, useRef } from "react";
import "../styles/SellerChat.css"; // dùng chung
import { motion, AnimatePresence } from "framer-motion";

function ChatWindow({ username, roomName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socketRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);
    socketRef.current.onmessage = (e) => {
  const data = JSON.parse(e.data);
  const newMsg = { sender: data.sender, text: data.message };

  setMessages((prev) => {
    const updated = [...prev, newMsg];

    // Lưu vào localStorage theo từng room
    const saved = localStorage.getItem("chat_history");
    const history = saved ? JSON.parse(saved) : {};
    history[roomName] = updated;
    localStorage.setItem("chat_history", JSON.stringify(history));

    return updated;
  });
};
    return () => socketRef.current && socketRef.current.close();
  }, [roomName]);

  const handleSend = () => {
  if (input.trim() === "" || !socketRef.current) return;

  const newMsg = { sender: username, text: input };

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
              <b>{msg.sender === username ? "Tôi" : msg.sender}:</b> {msg.text}
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
      
    </div>
  );
}

export default ChatWindow;
