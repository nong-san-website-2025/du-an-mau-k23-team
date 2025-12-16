import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonToast,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonButton,
} from "@ionic/react";
import { addOutline, mapOutline, checkmarkCircleOutline } from "ionicons/icons";

// Import các component đã tạo ở trên
import AddressCard from "../../components/Address/AddressCard";
import AddressModal from "../../components/Address/AddressModal";
import { Address } from "../../types/Address";
import { API } from "../../api/api";
import "../../styles/AddressBook.css"; // Import CSS Custom

const AddressBookPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Popup State
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Feedback State
  const [toast, setToast] = useState({
    msg: "",
    color: "success",
    isOpen: false,
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchAddresses = async () => {
    try {
      const res = await API.get<Address[]>("users/addresses/");
      // Delay giả 1 chút nếu mạng quá nhanh để user kịp thấy loading (tuỳ chọn)
      // await new Promise(resolve => setTimeout(resolve, 500));
      setAddresses(res);
    } catch (error) {
      console.error("Lỗi tải địa chỉ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleRefresh = async (event: CustomEvent) => {
    await fetchAddresses();
    event.detail.complete();
  };

  // --- CRUD ACTIONS ---
  const handleSaveAddress = async (data: Partial<Address>) => {
    try {
      if (editingAddress) {
        await API.put(`users/addresses/${editingAddress.id}/`, data);
        setToast({
          msg: "Đã cập nhật địa chỉ",
          color: "success",
          isOpen: true,
        });
      } else {
        await API.post("users/addresses/", data);
        setToast({
          msg: "Thêm địa chỉ mới thành công",
          color: "success",
          isOpen: true,
        });
      }
      fetchAddresses();
    } catch (error) {
      setToast({ msg: "Có lỗi xảy ra", color: "danger", isOpen: true });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`users/addresses/${deleteId}/`);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteId));
      setToast({ msg: "Đã xóa địa chỉ", color: "success", isOpen: true });
    } catch (error) {
      setToast({ msg: "Xóa thất bại", color: "danger", isOpen: true });
    } finally {
      setDeleteId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await API.patch(`users/addresses/${id}/`, { is_default: true });
      fetchAddresses();
      setToast({
        msg: "Đã thay đổi địa chỉ mặc định",
        color: "success",
        isOpen: true,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setShowModal(true);
  };
  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setShowModal(true);
  };

  // --- SUB COMPONENTS ---

  const SkeletonList = () => (
    <div className="ion-padding">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card">
          <IonSkeletonText
            animated
            style={{ width: "50%", height: "20px", borderRadius: "4px" }}
          />
          <IonSkeletonText
            animated
            style={{ width: "30%", marginTop: "8px", height: "16px" }}
          />
          <IonSkeletonText
            animated
            style={{ width: "90%", marginTop: "12px", height: "14px" }}
          />
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="empty-state-container">
      <div className="empty-icon-circle">
        <IonIcon
          icon={mapOutline}
          style={{ fontSize: "48px", color: "#2dd36f" }}
        />
      </div>
      <h3 style={{ fontWeight: 700, color: "#333" }}>Chưa có địa chỉ nào</h3>
      <p style={{ color: "#888", maxWidth: "80%", margin: "10px auto 30px" }}>
        Thêm địa chỉ nhận hàng để GreenFarm phục vụ bạn tốt hơn nhé!
      </p>
      <IonButton
        expand="block"
        size="large"
        shape="round"
        onClick={openAddModal}
        // Bỏ color="primary" ở đây là đúng, nhưng phải thay thế bằng --background
        style={{
          "--background": "#2E7D32", // Màu nền chính (Xanh đậm)
          "--box-shadow": "0 4px 10px rgba(46, 125, 50, 0.3)", // Bóng đổ (chỉnh lại màu bóng cho hợp với nền)
          fontWeight: "bold", // Chữ đậm thêm chút cho đẹp
        }}
      >
        <IonIcon slot="start" icon={addOutline} />
        Thêm địa chỉ ngay
      </IonButton>
    </div>
  );

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" color="dark" text="" />
          </IonButtons>
          <IonTitle style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
            Sổ địa chỉ
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingIcon={mapOutline} />
        </IonRefresher>

        {loading ? (
          <SkeletonList />
        ) : addresses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="ion-padding">
            {/* Hint UX cho người dùng */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "16px",
                color: "#aaa",
                fontSize: "0.8rem",
              }}
            >
              <small>
                💡 Vuốt sang trái để Xóa, sang phải để chọn Mặc định
              </small>
            </div>

            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={openEditModal}
                onDelete={(id) => setDeleteId(id)}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}

        {/* Nút FAB thêm mới (chỉ hiện khi đã có list) */}
        {!loading && addresses.length > 0 && (
          <IonFab
            vertical="bottom"
            horizontal="end"
            slot="fixed"
            className="ion-margin-bottom ion-margin-end"
          >
            <IonFabButton
              onClick={openAddModal}
              style={{
                "--box-shadow":
                  '0 4px 15px rgba(45,211,111,0.4), color: "#2E7D32',
                "--background": "#2E7D32",
              }}
            >
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {/* --- MODALS & ALERTS --- */}
        <AddressModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAddress}
          initialData={editingAddress}
        />

        <IonAlert
          isOpen={!!deleteId}
          onDidDismiss={() => setDeleteId(null)}
          header="Xác nhận xóa"
          message="Bạn chắc chắn muốn xóa địa chỉ này? Hành động không thể hoàn tác."
          buttons={[
            { text: "Hủy", role: "cancel", cssClass: "secondary" },
            {
              text: "Xóa",
              role: "confirm",
              handler: handleDelete,
              cssClass: "ion-color-danger",
            },
          ]}
        />

        <IonToast
          isOpen={toast.isOpen}
          onDidDismiss={() => setToast({ ...toast, isOpen: false })}
          message={toast.msg}
          duration={2000}
          color={toast.color}
          position="top"
          icon={toast.color === "success" ? checkmarkCircleOutline : undefined}
          layout="stacked"
        />
      </IonContent>
    </IonPage>
  );
};

export default AddressBookPage;
