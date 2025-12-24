// components/ConversationList.jsx
import React from "react";
import { Typography, Tooltip, Button, Input, Spin, Empty, Badge, Avatar } from "antd";
import { ReloadOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { THEME_COLOR, getBuyerAvatar, getBuyerName } from "../../utils/chatUtils";

const { Text } = Typography;

const ConversationList = ({ 
    conversations, 
    loading, 
    selectedConv, 
    onSelectConv, 
    onRefresh, 
    currentUserId,
    onDeleteConv
}) => {
    return (
        <div className="chat-sider-inner">
            <div className="sider-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Title level={4} style={{ margin: 0, color: THEME_COLOR }}>
                        Chat Support
                    </Typography.Title>
                    <Tooltip title="Làm mới">
                        <Button shape="circle" icon={<ReloadOutlined />} onClick={onRefresh} />
                    </Tooltip>
                </div>
                <Input
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="Tìm kiếm khách hàng..."
                    className="sider-search"
                    style={{ borderRadius: 20, background: '#f5f5f5', border: 'none' }}
                />
            </div>

            <div className="conv-list custom-scroll">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
                ) : conversations.length === 0 ? (
                    <Empty description="Chưa có tin nhắn" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    conversations.map(conv => {
                        const isActive = selectedConv?.id === conv.id;
                        const name = getBuyerName(conv, currentUserId);
                        const avatar = getBuyerAvatar(conv);

                        return (
                            <div
                                key={conv.id}
                                className={`conv-item ${isActive ? 'active' : ''}`}
                                onClick={() => onSelectConv(conv)}
                            >
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <Badge dot={true} color="green" offset={[-5, 35]}>
                                        <Avatar size={48} src={avatar} style={{ backgroundColor: THEME_COLOR }}>
                                            {name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                    </Badge>
                                    <div style={{ overflow: 'hidden', width: '100%' }}>
                                        <div className="conv-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                          <span className="text-truncate" style={{ maxWidth: '75%' }}>{name}</span>
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => { e.stopPropagation(); onDeleteConv?.(conv); }}
                                            title="Xóa hội thoại"
                                          />
                                        </div>
                                        <div className="conv-desc" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            Nhấn để xem tin nhắn...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default ConversationList;