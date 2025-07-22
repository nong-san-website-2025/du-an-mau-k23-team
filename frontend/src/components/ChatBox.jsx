import { useState, useEffect, useRef } from "react";
import { FaFacebookMessenger } from "react-icons/fa";
import "../styles/ChatBox.css";
import { motion, AnimatePresence } from "framer-motion";
import VideoCall from "./VideoCall";
function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function ChatBox({ username, roomName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);
  const user = username || localStorage.getItem("username") || "Người dùng";
  const room = roomName || "public";
  const bottomRef = useRef(null);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  useEffect(() => {
    if (isOpen && !socketRef.current) {
      const room = username || "public";
      socketRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${room}/`);

      socketRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const newMsg = {
          sender: data.sender,
          text: data.message,
          timestamp: data.timestamp || new Date().toISOString()
        };
        setMessages((prev) => {
          const updated = [...prev, newMsg];

          // 👉 Lưu vào localStorage theo từng phòng
          const saved = localStorage.getItem("chat_history");
          const history = saved ? JSON.parse(saved) : {};
          history[room] = updated;
          localStorage.setItem("chat_history", JSON.stringify(history));

          return updated;
        });

        // Bot tự động trả lời sau khi nhận được tin nhắn từ người dùng
        if (data.sender === user) {
          setTimeout(() => {
            // setMessages((prev) => [...prev, { sender: "Hệ thống", text: "Cảm ơn bạn đã liên hệ, chúng tôi sẽ phản hồi sớm nhất!" }]);
          }, 1000);
        }
        if (data.type === "call_offer") {
          setIsCalling(true);
          setTimeout(() => {
            socketRef.current._call?.handleAnswer(data.offer);
          }, 300); // đợi component mount
        }
        if (data.type === "call_answer") {
          socketRef.current._call?.handleReceiveAnswer(data.answer);
        }
        if (data.type === "ice_candidate") {
          socketRef.current._call?.handleAddCandidate(data.candidate);
        }
      };
      
      
      const saved = localStorage.getItem("chat_history");
      if (saved) {
        const history = JSON.parse(saved);
        if (history[room]) {
          setMessages(history[room]);
        }
      }
      

      return () => socketRef.current && socketRef.current.close();
    }
  }, [isOpen, room, user]);

  const handleSend = () => {
    if (input.trim() === "" || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({
      message: input,
      sender: user,
      timestamp: new Date().toISOString()
      
    }));

    setInput("");
  };
  const handleCall = async () => {
    // setIsCalling(true);

    // Bắt đầu stream âm thanh (hoặc video nếu bạn cần)
    const localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.send(JSON.stringify({
          type: "ice_candidate",
          candidate: event.candidate,
        }));
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    // Gửi offer qua socket
    socketRef.current.send(JSON.stringify({
      type: "call_offer",
      offer,
    }));

    // Gán vào socket để nhận phản hồi
    socketRef.current._call = {
      handleAnswer: async (remoteOffer) => {
        await peer.setRemoteDescription(new RTCSessionDescription(remoteOffer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socketRef.current.send(JSON.stringify({
          type: "call_answer",
          answer,
        }));
      },
      handleReceiveAnswer: async (answer) => {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      },
      handleAddCandidate: async (candidate) => {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };
  };

  const endCall = () => {
    setIsCalling(false);
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
            <span className="chatbox-title">Hỗ trợ khách hàng</span>
            <div className="chatbox-actions">
              <button className="call-btn" onClick={handleCall}>📞</button>
              <button className="chatbox-close" onClick={() => setIsOpen(false)}>×</button>
            </div>
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
                  <div className="chatbox-message-content">
                    <b>{msg.sender === username ? "Tôi" : msg.sender}:</b> {msg.text}
                    </div>
                  <div className="chatbox-message-time">{formatTime(msg.timestamp)}</div>
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
      {isCalling && (
            <VideoCall
              socketRef={socketRef}
              isCaller={true} // hoặc false nếu là người nhận
              onEndCall={endCall}
            />
          )}
    </div>
  );
}

export default ChatBox;
