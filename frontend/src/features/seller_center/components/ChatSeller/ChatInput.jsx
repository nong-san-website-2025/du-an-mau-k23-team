// components/ChatInput.jsx
import React, { useRef } from "react";
import { Input, Button, Tooltip } from "antd";
import { SendOutlined, PictureOutlined, CloseCircleFilled } from "@ant-design/icons";
import { THEME_COLOR } from "../../utils/chatUtils";

const { TextArea } = Input;

const ChatInput = ({ 
    input, 
    setInput, 
    onSend, 
    uploading, 
    selectedFile, 
    setSelectedFile 
}) => {
    const fileInputRef = useRef(null);
    const previewImage = selectedFile ? URL.createObjectURL(selectedFile) : null;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="input-area">
            {/* Preview ảnh upload */}
            {previewImage && (
                <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
                    <img 
                        src={previewImage} 
                        alt="preview" 
                        style={{ height: 80, borderRadius: 8, border: '1px solid #d9d9d9' }} 
                    />
                    <Button
                        type="primary" danger shape="circle" size="small"
                        icon={<CloseCircleFilled />}
                        style={{ position: 'absolute', top: -8, right: -8 }}
                        onClick={clearFile}
                    />
                </div>
            )}

            <div className="input-container">
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0])}
                />
                <Tooltip title="Gửi ảnh">
                    <Button
                        type="text" shape="circle"
                        icon={<PictureOutlined style={{ fontSize: 20, color: '#595959' }} />}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    />
                </Tooltip>

                <TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    className="chat-input"
                    onKeyDown={handleKeyDown}
                />

                <Button
                    type="primary" shape="circle"
                    icon={<SendOutlined />}
                    onClick={onSend}
                    loading={uploading}
                    disabled={!input.trim() && !selectedFile}
                    style={{ 
                        background: THEME_COLOR, 
                        borderColor: THEME_COLOR, 
                        boxShadow: '0 2px 6px rgba(0, 185, 107, 0.3)' 
                    }}
                />
            </div>
        </div>
    );
};

export default ChatInput;