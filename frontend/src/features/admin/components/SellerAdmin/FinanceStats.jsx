import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Empty,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  message,
} from "antd";

import {
  DollarOutlined,
  EyeOutlined,
  DownloadOutlined,
  BarChartOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";

import { Column } from "@ant-design/charts";
import dayjs from "dayjs";
import axios from "axios";
import { intcomma } from "../../../../utils/format";

export default function FinanceStats({ analytics, sellerId }) {
  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);

  if (!analytics) {
    return <Empty description="Chưa có dữ liệu tài chính" />;
  }

  const finance = analytics.finance || {};
  const withdrawalHistory = analytics.withdrawal_history || [];

  // Dummy chart data
  const chartData = [
    {
      month: "Tháng 1",
      revenue: finance.total_revenue || 0,
      commission: finance.total_commission || 0,
    },
    {
      month: "Tháng 2",
      revenue: finance.total_revenue || 0,
      commission: finance.total_commission || 0,
    },
    {
      month: "Tháng 3",
      revenue: finance.total_revenue || 0,
      commission: finance.total_commission || 0,
    },
  ];

  // Transform data
  const transformedData = chartData.flatMap((item) => [
    { ...item, type: "Doanh thu", value: item.revenue },
    { ...item, type: "Chiết khấu", value: item.commission },
  ]);

  const chartConfig = {
    data: transformedData,
    xField: "month",
    yField: "value",
    seriesField: "type",
    columnStyle: { radius: [8, 8, 0, 0] },
    color: ["#52c41a", "#ff4d4f"],
  };

  const withdrawalColumns = [
    {
      title: "Ngày rút",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      width: 150,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
      width: 150,
    },
    {
      title: "Phương thức",
      dataIndex: "method",
      key: "method",
      render: (method) => {
        const methodMap = {
          bank: "Chuyển khoản ngân hàng",
          wallet: "Ví điện tử",
          other: "Khác",
        };
        return methodMap[method] || method;
      },
      width: 180,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusMap = {
          approved: { color: "green", text: "Đã duyệt" },
          pending: { color: "orange", text: "Chờ xử lý" },
          rejected: { color: "red", text: "Từ chối" },
        };
        const config = statusMap[status] || { color: "default", text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      width: 120,
    },
  ];

  const handleExportReport = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/sellers/${sellerId}/finance-report/`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `finance-report-${sellerId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      message.success("Xuất báo cáo thành công!");
    } catch (error) {
      console.error("Error exporting report:", error);
      message.error("Có lỗi xảy ra khi xuất báo cáo");
    }
  };

  return (
    <div>
      {/* Thống kê nhanh */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={8}>
          <Card
            style={{
              borderRadius: "8px",
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            }}
          >
            <Statistic
              title="Doanh thu tháng này"
              value={finance.total_revenue || 0}
              prefix={<DollarOutlined style={{ color: "#10b981" }} />}
              suffix="₫"
              formatter={(value) => intcomma(Number(value))}
              valueStyle={{ fontSize: 24, fontWeight: 600, color: "#065f46" }}
              titleStyle={{ color: "#047857" }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            style={{
              borderRadius: "8px",
              background: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)",
            }}
          >
            <Statistic
              title="Tổng chiết khấu"
              value={finance.total_commission || 0}
              prefix={<DollarOutlined style={{ color: "#f59e0b" }} />}
              suffix="₫"
              formatter={(value) =>
                intcomma(Number(value))
              }
              valueStyle={{ fontSize: 24, fontWeight: 600, color: "#92400e" }}
              titleStyle={{ color: "#b45309" }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            style={{
              borderRadius: "8px",
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
            }}
          >
            <Statistic
              title="Có thể rút"
              value={finance.available_balance || 0}
              prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
              suffix="₫"
              formatter={(value) =>
                intcomma(Number(value))
              }
              valueStyle={{ fontSize: 24, fontWeight: 600, color: "#0c4a6e" }}
              titleStyle={{ color: "#0369a1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: "#1890ff" }} />
                So sánh doanh thu vs chiết khấu
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            <Column {...chartConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Lịch sử rút tiền */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <CreditCardOutlined style={{ color: "#52c41a" }} />
                Lịch sử rút tiền
              </Space>
            }
            style={{ borderRadius: 8 }}
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => setWithdrawalModalVisible(true)}
                >
                  Xem chi tiết
                </Button>

                <Tooltip title="Xuất báo cáo tài chính dạng PDF">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportReport}
                  >
                    Xuất PDF
                  </Button>
                </Tooltip>
              </Space>
            }
          >
            {withdrawalHistory.length > 0 ? (
              <Table
                columns={withdrawalColumns}
                dataSource={withdrawalHistory.slice(0, 5).map((item, idx) => ({
                  ...item,
                  key: idx,
                }))}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="Chưa có lịch sử rút tiền" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Modal */}
      <Modal
        title={
          <Space>
            <CreditCardOutlined style={{ color: "#52c41a" }} />
            Lịch sử rút tiền chi tiết
          </Space>
        }
        open={withdrawalModalVisible}
        onCancel={() => setWithdrawalModalVisible(false)}
        width={900}
        footer={null}
      >
        <Table
          columns={withdrawalColumns}
          dataSource={withdrawalHistory.map((item, idx) => ({
            ...item,
            key: idx,
          }))}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </div>
  );
}
