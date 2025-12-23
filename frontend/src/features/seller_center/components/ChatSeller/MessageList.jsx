    // components/MessageList.jsx
import React, { useEffect, useRef } from "react";
import { Spin, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { formatMessageTime, getBuyerAvatar } from "../../utils/chatUtils";

const MessageList = ({ 
    messages, 
    loading, 
    currentUserId, 
    selectedConv 
}) => {
    const listRef = useRef(null);

    // Tự động cuộn xuống dưới cùng khi có tin nhắn mới hoặc loading xong
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, loading]);

    return (
        <div className="messages-area custom-scroll" ref={listRef}>
            {loading ? (
                <div style={{ textAlign: 'center', marginTop: 20 }}><Spin /></div>
            ) : (
                messages.map((msg, index) => {
                    const isMine = msg.sender === currentUserId;
                    return (
                        <div key={index} className={`msg-row ${isMine ? 'mine' : 'other'}`}>
                            {!isMine && (
                                <Avatar 
                                    size={28} 
                                    src={getBuyerAvatar(selectedConv)} 
                                    icon={<UserOutlined />} 
                                />
                            )}
                            <div style={{ maxWidth: '100%' }}>
                                <div className="msg-bubble">
                                    {msg.content}
                                    {msg.image && <img src={msg.image} className="msg-image" alt="sent" />}
                                </div>
                                <div className="msg-time" style={{ textAlign: isMine ? 'right' : 'left' }}>
                                    {formatMessageTime(msg.created_at)}
                                </div>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    );
};

export default MessageList;