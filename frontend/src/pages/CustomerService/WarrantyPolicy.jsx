import React from "react";
import {
	PercentageOutlined,
	ToolOutlined,
	FileSearchOutlined,
	PhoneOutlined,
	MailOutlined,
} from "@ant-design/icons";
import { Card, Typography, Divider, List, Row, Col, Space, Tag } from "antd";

const { Title, Paragraph, Text, Link } = Typography;

const WarrantyPolicy = () => {
	return (
		<div style={{ background: "#f9fafb", minHeight: "100vh", padding: "40px" }}>
			<Row justify="center">
				<Col xs={24} md={20} lg={16}>
					<Card
						bordered={false}
						style={{
							borderRadius: 12,
							boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
							background: "#fff",
						}}
					>
						<Space direction="vertical" size="large" style={{ width: "100%", textAlign: "justify" }}>
							<div style={{ textAlign: "center" }}>
								<ToolOutlined style={{ fontSize: 40, color: "#1890ff" }} />
								<Title level={2} style={{ marginTop: 10 }}>
									Chính Sách Bảo Hành
								</Title>
								<Paragraph type="secondary" style={{ fontSize: 16 }}>
									Chúng tôi cung cấp chính sách bảo hành rõ ràng để bảo vệ quyền lợi khách hàng. Vui lòng đọc
									kỹ các điều khoản dưới đây để biết quyền lợi và thủ tục bảo hành.
								</Paragraph>
							</div>

							<Divider />

							<Title level={4}>1. Phạm vi bảo hành</Title>
							<List
								dataSource={[
									"Bảo hành cho các lỗi kỹ thuật phát sinh do nhà sản xuất.",
									"Không áp dụng cho hư hỏng do lắp đặt sai, sử dụng sai hướng dẫn, va đập, rơi vỡ.",
									"Một số phụ kiện tiêu hao, pin hoặc các bộ phận hao mòn không được bảo hành.",
								]}
								renderItem={(item) => (
									<List.Item>
										<Text>• {item}</Text>
									</List.Item>
								)}
							/>

							<Divider />

							<Title level={4}>2. Thời hạn bảo hành</Title>
							<Paragraph>
								Thời hạn bảo hành sẽ được ghi rõ trên phiếu bảo hành hoặc trang chi tiết sản phẩm. Nếu không có
								thông tin khác, mặc định bảo hành 12 tháng cho sản phẩm điện tử và 3 tháng cho phụ kiện đi kèm.
							</Paragraph>

							<Divider />

							<Title level={4}>3. Quy trình yêu cầu bảo hành</Title>
							<List
								dataSource={[
									"Liên hệ bộ phận chăm sóc khách hàng và cung cấp mã đơn hàng cùng mô tả vấn đề.",
									"Gửi hình ảnh/clip thể hiện lỗi (nếu có) để hỗ trợ đánh giá ban đầu.",
									"Gửi sản phẩm tới trung tâm bảo hành theo hướng dẫn để kiểm tra chính thức.",
									"Sau khi kiểm tra, nếu lỗi thuộc phạm vi bảo hành, sản phẩm sẽ được sửa chữa hoặc đổi mới.",
								]}
								renderItem={(item, idx) => (
									<List.Item>
										<Text strong style={{ marginRight: 8 }}>{idx + 1}.</Text>
										<Text style={{ flex: 1 }}>{item}</Text>
									</List.Item>
								)}
							/>

							<Divider />

							<Title level={4}>4. Trường hợp từ chối bảo hành</Title>
							<List
								dataSource={[
									"Sản phẩm bị can thiệp, mở máy không phải trung tâm bảo hành ủy quyền.",
									"Hư hỏng do thiên tai, tai nạn, cháy nổ, nước ngập.",
									"Sản phẩm đã quá hạn bảo hành hoặc không xuất trình được hóa đơn/phiếu bảo hành hợp lệ.",
								]}
								renderItem={(item) => (
									<List.Item>
										<Text>• {item}</Text>
									</List.Item>
								)}
							/>

							<Divider />

							<Title level={4}>5. Liên hệ bảo hành</Title>
							<Paragraph>Vui lòng liên hệ với chúng tôi để được hỗ trợ bảo hành:</Paragraph>
							<Space direction="vertical">
								<Tag icon={<PhoneOutlined />} color="blue">
									Hotline: <Link href="tel:0123456789">0123 456 789</Link>
								</Tag>
								<Tag icon={<MailOutlined />} color="green">
									Email: <Link href="mailto:hotro@duan.com">hotro@duan.com</Link>
								</Tag>
							</Space>

							<Divider />

							<Title level={4}>Ghi chú thêm</Title>
							<Paragraph>
								- Khi gửi yêu cầu bảo hành, vui lòng đính kèm hóa đơn mua hàng hoặc mã đơn để chúng tôi kiểm tra nhanh
								hơn.
							</Paragraph>
							<Paragraph>
								- Chi phí vận chuyển gửi sản phẩm đến trung tâm bảo hành có thể do khách hàng chịu, trừ khi lỗi
								do nhà sản xuất hoặc do lỗi giao hàng từ phía chúng tôi.
							</Paragraph>
						</Space>
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default WarrantyPolicy;
