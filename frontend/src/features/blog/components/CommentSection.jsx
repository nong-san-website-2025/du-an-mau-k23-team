import React, { useState, useMemo } from "react";
import {
  List,
  Avatar,
  Input,
  Button,
  message,
  Spin,
  Typography,
} from "antd";
import { UserOutlined, SendOutlined, MessageOutlined } from "@ant-design/icons";
import { addComment } from "../api/blogApi";

const { TextArea } = Input;
const { Text } = Typography;

// Hàm tạo màu cố định dựa trên tên (Consistent Hashing)
// Giúp avatar không bị đổi màu khi re-render
const stringToColor = (str) => {
  if (!str) return "#667eea";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const CommentItem = ({ author, content, datetime, avatar }) => {
  const avatarColor = useMemo(() => stringToColor(author), [author]);

  return (
    <div className="flex gap-4 p-4 mb-2 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
      <div className="flex-shrink-0">
        <Avatar
          size={40}
          src={avatar}
          icon={<UserOutlined />}
          style={{ backgroundColor: avatarColor }}
          className="shadow-sm border-2 border-white"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <Text strong className="text-gray-800 text-sm">
            {author}
          </Text>
          <Text type="secondary" className="text-xs">
            {datetime}
          </Text>
        </div>
        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
};

export default function CommentSection({ postId, initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [visibleCount, setVisibleCount] = useState(5); // Show 5 first looks cleaner
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.warning("Vui lòng nhập nội dung bình luận!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      message.error("Vui lòng đăng nhập để bình luận!");
      return;
    }

    setLoading(true);
    try {
      const res = await addComment({ post: postId, content: newComment }, token);
      // Giả lập response cấu trúc nếu API trả về khác
      const newCommentData = res.data || {
        id: Date.now(),
        content: newComment,
        author_name: "Bạn (Mới)",
        created_at: new Date().toISOString(),
      };

      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
      message.success("Đã gửi bình luận!");
    } catch (error) {
      console.error(error);
      message.error("Gửi thất bại, thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const visibleComments = comments.slice(0, visibleCount);

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-800 m-0">
          Bình luận <span className="text-gray-400 font-normal text-base">({comments.length})</span>
        </h3>
      </div>

      {/* Input Form */}
      <div className="mb-8 relative group">
        <TextArea
          rows={3}
          placeholder="Bạn đang nghĩ gì về bài viết này?..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && handleSubmit()}
          maxLength={500}
          className="!resize-none !bg-gray-50 hover:!bg-white focus:!bg-white !border-gray-200 focus:!border-blue-400 !rounded-xl !text-sm !p-4 !shadow-inner focus:!shadow-md transition-all"
        />

        <div className="flex justify-between items-center mt-2 mb-2">
          <span className="text-xs text-gray-400">
            Mẹo: Nhấn <kbd className="bg-gray-100 px-1 rounded border">Ctrl</kbd> + <kbd className="bg-gray-100 px-1 rounded border">Enter</kbd> để gửi
          </span>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!newComment.trim()}
              icon={<SendOutlined />}
              className="bg-blue-600 hover:bg-blue-500 border-none shadow-md shadow-blue-200 rounded-lg h-9 px-6 font-medium"
            >
              Gửi
            </Button>
          </div>
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <MessageOutlined className="text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Chưa có thảo luận nào.</p>
            <p className="text-gray-400 text-sm">Hãy là người đầu tiên chia sẻ ý kiến!</p>
          </div>
        ) : (
          <List
            dataSource={visibleComments}
            split={false} // Tắt đường gạch ngang mặc định của Antd để tự style
            renderItem={(c) => (
              <CommentItem
                author={c.author_name || "Người dùng ẩn danh"}
                content={c.content}
                avatar={c.author_avatar}
                datetime={new Date(c.created_at).toLocaleString("vi-VN", {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              />
            )}
          />
        )}

        {/* Load More Button */}
        {comments.length > visibleCount && (
          <div className="text-center mt-6">
            <Button
              type="text"
              onClick={() => setVisibleCount((p) => p + 5)}
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 font-medium"
            >
              Xem thêm bình luận cũ hơn
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}