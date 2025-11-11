// ./src/features/blog/components/CommentSection.jsx
import React, { useState } from "react";
import {
  List,
  Avatar,
  Input,
  Button,
  message,
  Spin,
  Typography,
  Space,
} from "antd";
import { UserOutlined, MessageOutlined } from "@ant-design/icons";
import { addComment } from "../api/blogApi";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

// Component bình luận tùy chỉnh
const CustomComment = ({
  author,
  content,
  datetime,
  avatar,
  avatarColor = "#667eea",
}) => {
  return (
    <div className="comment-item">
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Space size="middle">
          <Avatar
            size={44}
            src={avatar}
            icon={<UserOutlined />}
            style={{
              backgroundColor: avatarColor,
              background: `linear-gradient(135deg, ${avatarColor} 0%, #764ba2 100%)`,
            }}
          />
          <div>
            <Text className="comment-author">{author}</Text>
            <br />
            <Text className="comment-datetime">{datetime}</Text>
          </div>
        </Space>
        <Paragraph className="comment-content">{content}</Paragraph>
      </Space>
    </div>
  );
};

// Hàm tạo màu ngẫu nhiên cho avatar
const getRandomColor = () => {
  const colors = [
    "#667eea",
    "#f093fb",
    "#4facfe",
    "#43e97b",
    "#fa709a",
    "#feca57",
    "#ff6b6b",
    "#5f27cd",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function CommentSection({ postId, initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [visibleCount, setVisibleCount] = useState(10);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning("Vui lòng nhập nội dung bình luận!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      message.warning("Vui lòng đăng nhập để bình luận!");
      return;
    }

    setLoading(true);
    try {
      const res = await addComment(
        { post: postId, content: newComment },
        token
      );
      setComments((prev) => [res.data, ...prev]);
      setNewComment("");
      message.success("Bình luận của bạn đã được gửi! 🎉");
    } catch (error) {
      console.error("Lỗi khi gửi bình luận:", error);
      message.error("Gửi bình luận thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const visibleComments = comments.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="comment-section">
      <h2 className="comment-section-title">
        <MessageOutlined style={{ fontSize: "1.5rem" }} />
        Bình luận ({comments.length})
      </h2>

      {/* Form thêm bình luận - đặt lên đầu */}
      <div className="comment-form">
        <h3 className="comment-form-title">💬 Viết bình luận của bạn</h3>
        <TextArea
          rows={4}
          placeholder="Chia sẻ suy nghĩ của bạn về bài viết này... (Ctrl/Cmd + Enter để gửi)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyPress}
          maxLength={500}
          showCount
          className="comment-textarea"
        />
        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={loading}
            className="comment-submit-btn"
            icon={loading ? <Spin size="small" /> : null}
          >
            {loading ? "Đang gửi..." : "Gửi bình luận"}
          </Button>
        </div>
      </div>

      {/* Danh sách bình luận */}
      <div style={{ marginTop: "2.5rem" }}>
        {comments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "#94a3b8",
              fontSize: "1rem",
            }}
          >
            <MessageOutlined
              style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}
            />
            <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận! 🚀</p>
          </div>
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={visibleComments}
              renderItem={(c, index) => (
                <li key={c.id || `${c.created_at}-${index}`}>
                  <CustomComment
                    author={c.author_name || "Khách"}
                    content={c.content}
                    datetime={new Date(c.created_at).toLocaleString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    avatar={c.author_avatar}
                    avatarColor={getRandomColor()}
                  />
                </li>
              )}
            />

            {/* Nút xem thêm */}
            {comments.length > visibleCount && (
              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <Button
                  type="default"
                  onClick={handleLoadMore}
                  className="comment-load-more"
                >
                  Xem thêm {Math.min(10, comments.length - visibleCount)} bình
                  luận
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}