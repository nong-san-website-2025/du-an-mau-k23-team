import React, { useEffect, useState } from "react";
import {
  Input,
  Select,
  message,
  Spin,
  Modal,
  Descriptions,
  Button,
  Popconfirm,
} from "antd";
import ProductTable from "../../components/ProductAdmin/Product/ProductTable";
import SellerSelect from "../../components/ProductAdmin/Product/SellerSelect";
import axios from "axios";
import CategorySelect from "../../components/ProductAdmin/Product/CategorySelect";

const { Option } = Select;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

const ApprovalProductsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  const [sellers, setSellers] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("products/categories/", {
        headers: getAuthHeaders(),
      });
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách danh mục");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSellers();
    fetchCategories();
  }, []);

  // Lấy dữ liệu sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/", { headers: getAuthHeaders() });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];
      setData(raw);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách cửa hàng
  const fetchSellers = async () => {
    try {
      const res = await api.get("/sellers/", { headers: getAuthHeaders() });
      setSellers(res.data);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách cửa hàng");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSellers();
  }, []);

  // Bộ lọc dữ liệu
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.seller_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    const matchesSeller = sellerFilter
      ? String(item.seller) === String(sellerFilter)
      : true;
    const matchesCategory = categoryFilter
      ? String(item.category_id) === String(categoryFilter)
      : true;

    return matchesSearch && matchesStatus && matchesSeller && matchesCategory;
  });

  // Các hành động đơn lẻ
  const handleApprove = async (record) => {
    try {
      await api.post(
        `/products/${record.id}/approve/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(`Đã duyệt sản phẩm: ${record.name}`);
      fetchProducts();
    } catch {
      message.error("Duyệt thất bại");
    }
  };

  const handleReject = async (record) => {
    try {
      await api.post(
        `/products/${record.id}/reject/`,
        {},
        { headers: getAuthHeaders() }
      );
      message.success(`Đã từ chối sản phẩm: ${record.name}`);
      fetchProducts();
    } catch {
      message.error("Từ chối thất bại");
    }
  };

  const handleToggleBan = async (record) => {
    try {
      if (record.status === "banned") {
        await api.post(
          `/products/${record.id}/unban/`,
          {},
          { headers: getAuthHeaders() }
        );
        message.success("Đã mở khoá sản phẩm");
      } else {
        await api.post(
          `/products/${record.id}/ban/`,
          {},
          { headers: getAuthHeaders() }
        );
        message.success("Đã khoá sản phẩm");
      }
      fetchProducts();
    } catch {
      message.error("Có lỗi xảy ra khi đổi trạng thái");
    }
  };

  const handleView = (record) => {
    setSelectedProduct(record);
    setModalVisible(true);
  };

  // Hành động hàng loạt
  const handleBatchAction = async (action) => {
    if (!selectedRowKeys.length) return;
    try {
      setLoading(true);
      for (const id of selectedRowKeys) {
        if (action === "approve")
          await api.post(
            `/products/${id}/approve/`,
            {},
            { headers: getAuthHeaders() }
          );
        else if (action === "reject")
          await api.post(
            `/products/${id}/reject/`,
            {},
            { headers: getAuthHeaders() }
          );
        else if (action === "toggleBan") {
          const product = data.find((p) => p.id === id);
          if (product) {
            if (product.status === "banned")
              await api.post(
                `/products/${id}/unban/`,
                {},
                { headers: getAuthHeaders() }
              );
            else
              await api.post(
                `/products/${id}/ban/`,
                {},
                { headers: getAuthHeaders() }
              );
          }
        }
      }
      message.success("Thao tác hàng loạt thành công");
      setSelectedRowKeys([]);
      fetchProducts();
    } catch {
      message.error("Thao tác hàng loạt thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, background: "#fff", minHeight: "100vh" }}>
      <h2 style={{ padding: 10 }}>
        Quản lý duyệt sản phẩm
        {selectedRowKeys.length > 0 && (
          <span style={{ marginLeft: 16, fontSize: 14, color: "#1890ff" }}>
            ({selectedRowKeys.length} sản phẩm đã chọn)
          </span>
        )}
      </h2>

      {/* Toolbar */}
      <div
        style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}
      >
        <Input
          placeholder="Tìm kiếm theo tên sản phẩm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Lọc theo trạng thái"
          onChange={(value) => setStatusFilter(value)}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="pending">Chờ duyệt</Option>
          <Option value="approved">Đã duyệt</Option>
          <Option value="rejected">Bị từ chối</Option>
          <Option value="banned">Bị khóa</Option>
        </Select>
        <SellerSelect onChange={(value) => setSellerFilter(value)} />
        <CategorySelect onChange={(value) => setCategoryFilter(value)} />

        {/* Action hàng loạt */}
        {selectedRowKeys.length > 1 && (
          <div style={{ display: "flex", gap: 8 }}>
            <Popconfirm
              title="Duyệt tất cả sản phẩm đã chọn?"
              onConfirm={() => handleBatchAction("approve")}
            >
              <Button type="primary">Duyệt tất cả</Button>
            </Popconfirm>
            <Popconfirm
              title="Từ chối tất cả sản phẩm đã chọn?"
              onConfirm={() => handleBatchAction("reject")}
            >
              <Button danger>Từ chối tất cả</Button>
            </Popconfirm>
            <Popconfirm
              title="Đổi trạng thái khoá/mở khoá tất cả sản phẩm đã chọn?"
              onConfirm={() => handleBatchAction("toggleBan")}
            >
              <Button>Khoá/Mở khoá tất cả</Button>
            </Popconfirm>
          </div>
        )}
      </div>

      {loading ? (
        <Spin />
      ) : (
        <ProductTable
          data={filteredData}
          selectedRowKeys={selectedRowKeys} // ✅ phải truyền
          setSelectedRowKeys={setSelectedRowKeys}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={handleView}
          onToggleBan={handleToggleBan}
        />
      )}

      {/* Modal chi tiết */}
      {selectedProduct && (
        <Modal
          open={modalVisible}
          title={`Chi tiết sản phẩm: ${selectedProduct.name}`}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="ID">
              {selectedProduct.id}
            </Descriptions.Item>
            <Descriptions.Item label="Tên sản phẩm">
              {selectedProduct.name}
            </Descriptions.Item>
            <Descriptions.Item label="Danh mục">
              {selectedProduct.category_name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Shop">
              {selectedProduct.seller_name || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá">
              {Number(selectedProduct.price).toLocaleString("vi-VN")} đ
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng">
              {selectedProduct.stock}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {selectedProduct.status}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {selectedProduct.created_at}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {selectedProduct.description || "-"}
            </Descriptions.Item>
          </Descriptions>
        </Modal>
      )}
    </div>
  );
};

export default ApprovalProductsPage;
