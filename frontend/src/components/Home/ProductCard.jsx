import { Card } from "antd";
const { Meta } = Card;

export default function ProductCard({ product, onClick }) {
  return (
    <Card
      hoverable
      cover={<img alt={product.name} src={product.image} className="h-[200px] object-cover" />}
      onClick={() => onClick && onClick(product.id)}
    >
      <Meta title={product.name} description={`${product.price.toLocaleString()} VND`} />
    </Card>
  );
}
