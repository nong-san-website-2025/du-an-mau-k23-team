import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Badge, Spin, message } from "antd";
import axios from "axios";

const { Meta } = Card;

// Format tiền VND
const formatVND = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return Math.round(n).toLocaleString("vi-VN");
};

// Format ngày
const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
};

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);

  const token = localStorage.getItem("token");

  useEffect(() => {
  const fetchStoreData = async () => {
    try {
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      // 1) Lấy info cửa hàng
      const storeRes = await axios.get(`http://localhost:8000/api/sellers/${id}/`, { headers: authHeader });
      setStore(storeRes.data);
      setFollowers(storeRes.data.followers_count || 0);
      setIsFollowing(Boolean(storeRes.data.is_following));

      // 2) Lấy sản phẩm cửa hàng
      const productsRes = await axios.get(`http://localhost:8000/api/products/?seller=${id}`);
      setProducts(productsRes.data.results || productsRes.data || []);

      // 3) Lấy voucher: cửa hàng + toàn sàn (2 call và gộp)
      const [sellerVoucherRes, systemVoucherRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/promotions/vouchers/`, {
          params: { active: true, seller: id, ordering: '-created_at' },
        }),
        axios.get(`http://localhost:8000/api/promotions/vouchers/`, {
          params: { active: true, scope: 'system', ordering: '-created_at' },
        }),
      ]);

      const combined = [
        ...(sellerVoucherRes.data || []),
        ...(systemVoucherRes.data || []),
      ];

      // Lọc theo hiệu lực thời gian, không loại trùng
      const now = new Date();
      const valid = (v) => (
        (!v.start_at || new Date(v.start_at) <= now) &&
        (!v.end_at || new Date(v.end_at) >= now) &&
        v.active
      );

      setVouchers(combined.filter(valid));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchStoreData();
}, [id, token]);

  const handleCopyVoucher = (v) => {
    navigator.clipboard.writeText(v.code);
    message.success(`Đã sao chép voucher ${v.code}`);
  };

  const handleUseVoucher = (v) => {
    localStorage.setItem("selectedVoucher", JSON.stringify({ code: v.code, sellerId: id, savedAt: Date.now() }));
    message.success(`Voucher ${v.code} đã chọn, áp dụng khi thanh toán`);
  };

  const handleFollow = async () => {
    if (!token) {
      navigate("/login", { state: { redirectTo: `/store/${id}` } });
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (!isFollowing) {
        await axios.post(`http://localhost:8000/api/sellers/${id}/follow/`, {}, { headers });
        setFollowers(f => f + 1);
      } else {
        await axios.delete(`http://localhost:8000/api/sellers/${id}/follow/`, { headers });
        setFollowers(f => Math.max(0, f - 1));
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi cập nhật trạng thái theo dõi");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!store) return <p style={{ textAlign: "center", marginTop: 50 }}>Cửa hàng không tồn tại</p>;

  return (
    <div style={{ padding: '0 45px', marginTop: 24 }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <img
              src={store.image || "/assets/logo/imagelogo.png"}
              alt={store.store_name}
              style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
            />
          </Col>
          <Col flex="auto">
            <h3>{store.store_name}</h3>
            <p>{store.bio}</p>
            <small>Followers: {followers}</small>
          </Col>
          <Col>
            <Button type={isFollowing ? "default" : "primary"} onClick={handleFollow}>
              {isFollowing ? "Đang theo dõi" : "Theo dõi"}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Vouchers */}
      <h5>Mã Voucher</h5>
      <Row gutter={[16, 16]}>
        {vouchers.length > 0 ? vouchers.map(v => (
          <Col xs={24} sm={12} md={8} key={v.code}>
            <Card size="small">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 500 }}>{v.title || "Voucher"}</span>
            <Badge color={v.scope === "seller" ? "blue" : "gray"} text={v.scope === "seller" ? "Cửa hàng" : "Toàn sàn"} />
            </div>
            <p style={{ marginBottom: 4 }}>{v.description}</p>
            {v.discount_percent && <p style={{ marginBottom: 4 }}>Giảm {v.discount_percent}%</p>}
            {v.discount_amount && <p style={{ marginBottom: 4 }}>Giảm {formatVND(v.discount_amount)} VNĐ</p>}
            {v.min_order_value && <p style={{ marginBottom: 4 }}>Đơn tối thiểu: {formatVND(v.min_order_value)} VNĐ</p>}
            <p style={{ marginBottom: 4 }}>Hiệu lực: {formatDate(v.start_at)} - {formatDate(v.end_at)}</p>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <Button size="small" onClick={() => handleCopyVoucher(v)}>Sao chép</Button>
              <Button size="small" type="primary" onClick={() => handleUseVoucher(v)}>Dùng ngay</Button>
            </div>
          </Card>

          </Col>
        )) : <p>Chưa có voucher.</p>}
      </Row>

      {/* Sản phẩm */}
      <h5>Sản phẩm</h5>
      <Row gutter={[16, 16]}>
        {products.length > 0 ? products.map(p => (
          <Col xs={24} sm={12} md={6} key={p.id}>
            <Card
              hoverable
              cover={<img alt={p.name} src={p.image || "/assets/logo/imagelogo.png"} style={{ height: 200, objectFit: "cover" }} />}
            >
              <Meta title={p.name} description={<span className="text-danger">{formatVND(p.discounted_price || p.price)} VNĐ</span>} />
              <Badge color="gray" text={`Còn ${p.stock} ${p.unit}`} style={{ marginTop: 4 }} />
            </Card>
          </Col>
        )) : <p>Chưa có sản phẩm.</p>}
      </Row>
    </div>
  );
};

export default StoreDetail;
