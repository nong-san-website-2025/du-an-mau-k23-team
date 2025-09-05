import { Row, Col, Card } from "antd";
import ProductCard from "./ProductCard";

export default function FlashSaleSection({ products }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="my-6">
      <h2 className="text-xl font-bold mb-4">🔥 Flash Sale</h2>
      <Row gutter={[16, 16]}>
        {products.map((product) => (
          <Col key={product.id} xs={12} sm={8} md={6} lg={4}>
            <ProductCard product={product} />
          </Col>
        ))}
      </Row>
    </div>
  );
}
