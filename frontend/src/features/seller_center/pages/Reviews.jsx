import React from "react";
import { List, Rate, Card } from "antd";

const data = [
  { id: 1, user: "Nguyễn Văn A", rating: 5, comment: "Rất tươi ngon!" },
  { id: 2, user: "Trần Thị B", rating: 4, comment: "Giao hàng nhanh" },
];

export default function Reviews() {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Đánh giá khách hàng</h2>
      <List
        dataSource={data}
        renderItem={item => (
          <List.Item>
            <Card title={item.user}>
              <Rate disabled defaultValue={item.rating} />
              <p>{item.comment}</p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
