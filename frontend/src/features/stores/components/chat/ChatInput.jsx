import React, { useRef, useEffect } from "react";
import { Paperclip, Send, X } from "lucide-react";
import styles from "./ChatBox.module.css";

const FilePreview = ({ file, onRemove }) => (
  <div className={styles.filePreview}>
    {file.type.startsWith("image/") ? (
      <img src={URL.createObjectURL(file)} alt="preview" />
    ) : (
      <Paperclip />
    )}
    <span>{file.name}</span>
    <button
      onClick={onRemove}
      className={styles.chatActionBtn}
      style={{ width: 24, height: 24 }}
    >
      <X size={16} />
    </button>
  </div>
);

const ChatInput = ({
  input,
  setInput,
  handleSendMessage,
  setSelectedFile,
  selectedFile,
  uploading,
  status,
  sendTypingSignal,
}) => {
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // HÀM XỬ LÝ CHÍNH KHI GÕ PHÍM
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (sendTypingSignal) {
      // 1. Gửi ngay lập tức tín hiệu đang gõ
      if (value.length > 0) {
        sendTypingSignal(true);

        // 2. Debounce: Nếu ngừng gõ 2 giây thì báo dừng
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingSignal(false);
        }, 2000);
      } else {
        // Nếu xóa sạch input thì báo dừng gõ luôn
        sendTypingSignal(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const onEnterPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || selectedFile) {
        handleSendMessage();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (sendTypingSignal) sendTypingSignal(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <footer className={styles.chatInputArea}>
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          onRemove={() => setSelectedFile(null)}
        />
      )}
      <div className={styles.inputWrapper}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept="image/*"
        />
        
        <button
          className={styles.chatActionBtn}
          title="Đính kèm file"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Paperclip size={20} />
        </button>

        <input
          className={styles.chatInput}
          value={input}
          onChange={handleInputChange} // DÙNG HÀM handleInputChange Ở ĐÂY
          onBlur={() => {
            if (sendTypingSignal) sendTypingSignal(false);
          }}
          placeholder="Nhập tin nhắn..."
          onKeyDown={onEnterPress}
          disabled={uploading || status === "loading"}
        />

        <button
          className={`${styles.chatActionBtn} ${styles.sendBtn}`}
          onClick={() => {
            handleSendMessage();
            if (sendTypingSignal) sendTypingSignal(false);
          }}
          disabled={
            uploading ||
            (!input.trim() && !selectedFile) ||
            status === "loading"
          }
          type="button"
        >
          {uploading ? "..." : <Send size={20} />}
        </button>
      </div>
    </footer>
  );
};

export default ChatInput;