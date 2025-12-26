import React from "react";
import {
  Modal,
  Upload,
  Typography,
  Card,
  Input,
  Tabs,
  Button,
  Divider,
  message,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  DeleteOutlined,
  StarFilled,
  StarOutlined,
  ImportOutlined,
  EyeOutlined,
} from "@ant-design/icons";

// Components & Hook
import ProductTable from "../components/ProductSeller/ProductTable";
import ProductForm from "../components/ProductSeller/ProductForm";
import ProductDetailModal from "../components/ProductSeller/ProductDetailModal";
import ImportProductModal from "../components/ProductSeller/ImportProductModal";
import { useProductPage } from "../hooks/useProductPage"; // Import Hook vừa tạo

import "../styles/ProductPage.css";
import { EyeClosed } from "lucide-react";
const { Title, Text } = Typography;

export default function ProductsPage() {
  // Lấy toàn bộ logic từ Custom Hook
  const {
    filteredProducts,
    categories,
    loading,
    selectedRowKeys,
    setSelectedRowKeys,
    setSelectedRows,
    rowSelection,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    tabItems,

    modalVisible,
    setModalVisible,
    importModalVisible,
    setImportModalVisible,
    editingProduct,

    selectedProduct,
    setSelectedProduct,
    isDetailModalVisible,
    setIsDetailModalVisible,

    galleryVisible,
    setGalleryVisible,
    galleryFileList,
    setGalleryFileList,
    galleryLoading,

    fetchData,
    handleBulkDelete,
    handleBulkToggleHide,
    handleAddNew,
    handleEdit,
    handleImportSuccess,
    handleDelete,
    handleSelfReject,
    handleToggleHide,
    handleSubmitForm,
    openGallery,
    handleSetPrimaryImage,
    handleRemoveImage,
    handleGalleryUpload,

    getStatusConfig,
    getAvailabilityConfig,
  } = useProductPage();

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#f0f2f5", padding: "0px" }}
    >
      <Card
        bordered={false}
        style={{ borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
      >
        {/* Toolbar */}
        <div
          className="page-toolbar"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            DANH SÁCH SẢN PHẨM
          </Title>
          <div className="toolbar-actions" style={{ display: "flex", gap: 10 }}>
            <Input
              placeholder="Tìm theo tên, mã SP..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Làm mới
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportModalVisible(true)}
              className="btn-import"
            >
              Nhập Excel
            </Button>
            <Button
              className="btn-add"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
            >
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          style={{ marginBottom: 16 }}
        />

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <ProductTable
            data={filteredProducts}
            loading={loading}
            onView={(record) => {
              setSelectedProduct(record);
              setIsDetailModalVisible(true);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelfReject={handleSelfReject}
            onToggleHide={handleToggleHide}
            rowSelection={rowSelection}
            onRow={(record) => ({
              onClick: () => {
                setSelectedProduct(record);
                setIsDetailModalVisible(true);
              },
            })}
          />
        </div>

        {/* --- FLOAT BULK ACTIONS --- */}
        {selectedRowKeys.length > 0 &&
          (() => {
            const approvedProducts = filteredProducts.filter(
              (p) => selectedRowKeys.includes(p.id) && p.status === "approved"
            );
            const hiddenCount = approvedProducts.filter(
              (p) => p.is_hidden
            ).length;
            const visibleCount = approvedProducts.length - hiddenCount;

            const canToggleHide =
              approvedProducts.length > 0 &&
              ((hiddenCount > 0 && visibleCount === 0) ||
                (visibleCount > 0 && hiddenCount === 0));

            const isAllHidden =
              approvedProducts.length > 0 &&
              hiddenCount === approvedProducts.length;

            return (
              <div className="bulk-action-bar">
                <div className="bulk-info">
                  Đã chọn{" "}
                  <span style={{ color: "#fff", fontWeight: 600 }}>
                    {selectedRowKeys.length}
                  </span>
                </div>
                <div className="bulk-divider" />
                <Button
                  type="text"
                  size="middle"
                  onClick={() => {
                    setSelectedRowKeys([]);
                    setSelectedRows([]);
                  }}
                  style={{ color: "#a6a6a6" }}
                >
                  Hủy
                </Button>
                <div style={{ display: "flex", gap: 8 }}>
                  {canToggleHide && (
                    <Button
                      size="middle"
                      shape="round"
                      onClick={() => handleBulkToggleHide()}
                      style={{
                        backgroundColor: isAllHidden ? "#52c41a" : "#434343",
                        color: "#fff",
                        border: "none",
                      }}
                      icon={isAllHidden ? <EyeOutlined /> : <EyeClosed />}
                    >
                      {isAllHidden ? "Hiển thị" : "Ẩn"}
                    </Button>
                  )}
                  <Button
                    type="primary"
                    danger
                    size="middle"
                    shape="round"
                    icon={<DeleteOutlined />}
                    onClick={handleBulkDelete}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            );
          })()}
      </Card>

      {/* --- MODALS --- */}
      <ProductDetailModal
        visible={isDetailModalVisible}
        onClose={() => setIsDetailModalVisible(false)}
        product={selectedProduct}
        onManageImages={openGallery}
        getStatusConfig={getStatusConfig}
        getAvailabilityConfig={getAvailabilityConfig}
      />

      <ProductForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmitForm}
        initialValues={editingProduct}
        categories={categories}
      />

      <ImportProductModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Gallery Modal */}
      <Modal
        open={galleryVisible}
        title={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <UploadOutlined /> Quản lý thư viện ảnh
          </div>
        }
        onCancel={() => setGalleryVisible(false)}
        footer={[
          <Button key="back" onClick={() => setGalleryVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleGalleryUpload}
            loading={galleryLoading}
            disabled={!galleryFileList.some((f) => f.originFileObj)}
          >
            Tải lên ảnh mới
          </Button>,
        ]}
        width={800}
        centered
      >
        <div style={{ padding: 16 }}>
          <Title level={5} style={{ marginBottom: 16 }}>
            Ảnh hiện tại
          </Title>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {galleryFileList
              .filter((f) => !f.originFileObj)
              .map((file) => (
                <div
                  key={file.uid}
                  style={{
                    position: "relative",
                    width: 120,
                    height: 120,
                    border: file.is_primary
                      ? "2px solid #faad14"
                      : "1px solid #d9d9d9",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={file.url}
                    alt="product"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      background: "rgba(0,0,0,0.6)",
                      padding: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={
                        file.is_primary ? (
                          <StarFilled style={{ color: "#faad14" }} />
                        ) : (
                          <StarOutlined style={{ color: "white" }} />
                        )
                      }
                      onClick={() => handleSetPrimaryImage(file.uid)}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveImage(file)}
                    />
                  </div>
                  {file.is_primary && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "#faad14",
                        color: "white",
                        fontSize: 10,
                        padding: "2px 6px",
                        borderBottomLeftRadius: 8,
                      }}
                    >
                      Chính
                    </div>
                  )}
                </div>
              ))}
            {galleryFileList.filter((f) => !f.originFileObj).length === 0 && (
              <Text type="secondary" italic>
                Chưa có ảnh trong thư viện.
              </Text>
            )}
          </div>
          <Divider />
          <Title level={5} style={{ marginBottom: 16 }}>
            Thêm ảnh mới
          </Title>
          <Upload
            listType="picture-card"
            fileList={galleryFileList.filter((f) => f.originFileObj)}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              const oldFiles = galleryFileList.filter((f) => !f.originFileObj);
              if (oldFiles.length + fileList.length <= 6)
                setGalleryFileList([...oldFiles, ...fileList]);
              else message.warning("Tổng cộng tối đa 6 ảnh");
            }}
            onRemove={(file) => handleRemoveImage(file)}
            multiple
          >
            {galleryFileList.length < 6 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Chọn ảnh</div>
              </div>
            )}
          </Upload>
        </div>
      </Modal>
    </div>
  );
}
