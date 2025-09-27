import React from "react";
import { Card, Button, Image } from "antd";
import { useNavigate } from "react-router-dom";

const StoreCard = ({ store, productId }) => {
  const navigate = useNavigate();

  return (
    <Card style={{ marginTop: 24, borderRadius: 12 }}>
      <Card.Meta
        avatar={
          <Image
            src={store.image || "https://via.placeholder.com/80x80"}
            width={60}
            height={60}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        }
        title={store.store_name}
        description={
          <Button
            type="primary"
            ghost
            onClick={() => navigate(`/store/${store.id}`, { state: { productId } })}
          >
            Xem shop
          </Button>
        }
      />
    </Card>
  );
};

export default StoreCard;