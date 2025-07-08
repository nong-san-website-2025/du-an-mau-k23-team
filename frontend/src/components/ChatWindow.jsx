import { useState, useEffect, useRef } from "react";
import "../styles/ChatBox.css";

function ChatWindow({ username, roomName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, { sender: data.sender, text: data.message }]);
    };

    return () => socketRef.current && socketRef.current.close();
  }, [roomName]);

  const handleSend = () => {
    if (input.trim() === "" || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({
      message: input,
      sender: username
    }));

    setInput("");
  };

  return (
    <div className="chatbox-popup">
      <div className="chatbox-header">Khách hàng {roomName}</div>
      <div className="chatbox-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatbox-message ${msg.sender === username ? "user" : "bot"}`}>
            <b>{msg.sender}:</b> {msg.text}
          </div>
        ))}
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
  );
}

export default ChatWindow;
