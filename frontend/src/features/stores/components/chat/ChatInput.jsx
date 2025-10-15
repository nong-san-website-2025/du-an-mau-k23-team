import React, { useRef } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import styles from './ChatBox.module.css';

const FilePreview = ({ file, onRemove }) => (
  <div className={styles.filePreview}>
    {file.type.startsWith('image/') ? (
      <img src={URL.createObjectURL(file)} alt="preview" />
    ) : (
      <Paperclip />
    )}
    <span>{file.name}</span>
    <button onClick={onRemove} className={styles.chatActionBtn} style={{ width: 24, height: 24 }}>
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
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const onEnterPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <footer className={styles.chatInputArea}>
      {selectedFile && (
        <FilePreview file={selectedFile} onRemove={() => setSelectedFile(null)} />
      )}
      <div className={styles.inputWrapper}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="image/*"
        />
        <button
          className={styles.chatActionBtn}
          title="Đính kèm file"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={20} />
        </button>
        <input
          className={styles.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          onKeyDown={onEnterPress}
          disabled={uploading || status === 'loading'}
        />
        <button
          className={`${styles.chatActionBtn} ${styles.sendBtn}`}
          onClick={handleSendMessage}
          disabled={uploading || (!input.trim() && !selectedFile) || status === 'loading'}
        >
          {uploading ? '...' : <Send size={20} />}
        </button>
      </div>
    </footer>
  );
};

export default ChatInput;
