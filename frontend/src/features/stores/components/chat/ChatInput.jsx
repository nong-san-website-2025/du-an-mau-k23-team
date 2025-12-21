import React, { useRef, useEffect } from "react";
import { Paperclip, Send, X, Image as ImageIcon } from "lucide-react";
import styles from "../../styles/ChatBox.module.css";

const ChatInput = ({ input, setInput, handleSendMessage, setSelectedFile, selectedFile, uploading, status }) => {
  const fileInputRef = useRef(null);

  const onEnterPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || selectedFile) && !uploading) handleSendMessage();
    }
  };

  return (
    <footer className={styles.chatInputArea}>
      {/* File Preview */}
      {selectedFile && (
        <div className={styles.filePreview}>
          <ImageIcon size={16} color="#0ea5e9" />
          <span>{selectedFile.name}</span>
          <button onClick={() => setSelectedFile(null)} className={styles.chatActionBtn} style={{padding: 4}}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className={styles.inputWrapper}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
          style={{ display: "none" }}
          accept="image/*"
        />
        
        <button className={styles.chatActionBtn} onClick={() => fileInputRef.current?.click()} title="Gửi ảnh">
          <Paperclip size={20} />
        </button>

        <input
          className={styles.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          onKeyDown={onEnterPress}
          disabled={uploading || status === "loading"}
        />

        <button
          className={`${styles.chatActionBtn} ${styles.sendBtn}`}
          onClick={handleSendMessage}
          disabled={uploading || (!input.trim() && !selectedFile)}
        >
          {uploading ? <div className={styles.typingDot} style={{background: 'white'}}/> : <Send size={18} />}
        </button>
      </div>
    </footer>
  );
};

export default ChatInput;