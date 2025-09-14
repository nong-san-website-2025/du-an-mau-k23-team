  import React, { useEffect, useState } from "react";
  import { Table, Button, Space, Tag, message, Popconfirm } from "antd";
  import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
  import { getAdvertisements, deleteAdvertisement } from "../../services/advertisementApi";
  import AdvertisementForm from "../../components/MarketingAdmin/AdvertisementForm";

  export default function AdvertisementList() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingAd, setEditingAd] = useState(null);

    const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdvertisements();
      console.log("Advertisements API Response:", res.data);

      // Kiểm tra và set state đúng cách
      if (Array.isArray(res.data)) {
        setAds(res.data);
      } else if (Array.isArray(res.data.results)) {
        setAds(res.data.results); // nếu API trả về dạng { count, results }
      } else {
        setAds([]);
        message.warning("API không trả về đúng định dạng mảng!");
      }
    } catch (error) {
      message.error("Không thể tải dữ liệu quảng cáo!");
    } finally {
      setLoading(false);
    }
  };


    const handleDelete = async (id) => {
      try {
        await deleteAdvertisement(id);
        message.success("Xóa quảng cáo thành công!");
        fetchData();
      } catch (error) {
        message.error("Xóa thất bại!");
      }
    };

    useEffect(() => {
      fetchData();
    }, []);

    const columns = [
      {
        title: "Hình ảnh",
        dataIndex: "image_url",
        render: (text) => <img src={text} alt="ad" style={{ width: 80, borderRadius: 6 }} />,
      },
      {
        title: "Tiêu đề",
        dataIndex: "title",
      },
      {
        title: "Loại",
        dataIndex: "ad_type_display",
        render: (text) => <Tag color="blue">{text}</Tag>,
      },
      {
        title: "Mục tiêu",
        dataIndex: "target_type_display",
        render: (text) => <Tag color="green">{text}</Tag>,
      },
      {
        title: "Trạng thái",
        dataIndex: "is_active",
        render: (active) =>
          active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Ngưng</Tag>,
      },
      {
        title: "Hành động",
        render: (_, record) => (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setEditingAd(record);
                setOpenModal(true);
              }}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc muốn xóa quảng cáo này?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button icon={<DeleteOutlined />} danger>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <div>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAd(null);
              setOpenModal(true);
            }}
          >
            Thêm quảng cáo
          </Button>
        </Space>

        <Table
          dataSource={ads}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        <AdvertisementForm
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSuccess={fetchData}
          initialData={editingAd}
        />
      </div>
    );
  }
