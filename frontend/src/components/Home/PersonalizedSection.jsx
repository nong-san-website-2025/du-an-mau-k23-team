import { Card, Row, Col } from "antd";
import ProductCard from "./ProductCard";

export default function PersonalizedSection({ username, recommended, vouchers }) {
  return (
    <div className="my-6">
      {/* Lời chào cá nhân */}
      <Card className="mb-4">
        <h3 className="text-lg font-semibold">Xin chào, {username} 👋</h3>
        <p>Chào mừng bạn trở lại, hãy khám phá các sản phẩm được gợi ý cho bạn.</p>
      </Card>

      {/* Voucher */}
      {vouchers && vouchers.length > 0 && (
        <Card className="mb-6">
          <h4 className="font-bold mb-2">🎁 Voucher dành riêng cho bạn</h4>
          <Row gutter={[8, 8]}>
            {vouchers.map((voucher) => (
              <Col key={voucher.id} xs={12} sm={8} md={6}>
                <Card className="bg-green-100 text-center">
                  <p className="font-bold text-green-700">{voucher.code}</p>
                  <p>Giảm {voucher.discount_value}%</p>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Đề xuất sản phẩm */}
      {recommended && recommended.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4">Dành riêng cho bạn</h2>
          <Row gutter={[16, 16]}>
            {recommended.map((product) => (
              <Col key={product.id} xs={12} sm={8} md={6} lg={4}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
}
