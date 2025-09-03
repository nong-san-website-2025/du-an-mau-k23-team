import React from "react";
import { Card, Descriptions, Button } from "antd";

export default function StoreInfo() {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Thông tin cửa hàng</h2>
      <Card>
        <Descriptions column={1}>
          <Descriptions.Item label="Tên cửa hàng">Nông sản Xanh</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">Hà Nội</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">0123456789</Descriptions.Item>
        </Descriptions>
        <Button type="primary" className="mt-4">Chỉnh sửa</Button>
      </Card>
    </div>
  );
}
