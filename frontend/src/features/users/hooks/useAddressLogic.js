// src/hooks/useAddressLogic.js
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../login_register/services/api";

const useAddressLogic = (activeTab, navigate) => {
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    phone: "",
    location: "",
  });

  const fetchAddresses = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAddresses([]);
      return;
    }
    try {
      const res = await API.get("users/addresses/");
      setAddresses(res.data);
    } catch (err) {
      console.error("Fetch addresses failed:", err);
      // setAddresses([]);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch on mount
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    // Also refresh when switching to the address tab
    if (activeTab === "address") fetchAddresses();
  }, [activeTab, fetchAddresses]);

  const addAddress = async (addressData) => {
    try {
      await API.post("users/addresses/", addressData);
      await fetchAddresses();
      setShowAddressForm(false);
      setNewAddress({ recipient_name: "", phone: "", location: "" });
      toast.success("✅ Thêm địa chỉ thành công!");
    } catch (error) {
      console.error("Lỗi thêm địa chỉ:", error.response?.data || error.message);
      toast.error("❌ Thêm địa chỉ thất bại!");
    }
  };

  const editAddress = async (id, data) => {
    try {
      await API.put(`users/addresses/${id}/`, data);
      fetchAddresses();
      toast.success("✅ Chỉnh sửa địa chỉ thành công!");
    } catch {
      toast.error("❌ Chỉnh sửa địa chỉ thất bại!");
    }
  };

  const deleteAddress = async (id) => {
    try {
      await API.delete(`users/addresses/${id}/`);
      fetchAddresses();
      toast.success("Xóa địa chỉ thành công!", { theme: "light" });
    } catch {
      toast.error("Xóa địa chỉ thất bại!", { theme: "light" });
    }
  };

  const setDefaultAddress = async (id) => {
    // Optimistic UI update
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    );
    try {
      await API.patch(`users/addresses/${id}/set_default/`);
      fetchAddresses();
      toast.success("Đã thay đổi địa chỉ mặc định", { theme: "light" });
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect"
      );
      if (redirect === "checkout") navigate("/checkout");
    } catch {
      // Revert on failure
      fetchAddresses();
      toast.error("Không thể đặt địa chỉ mặc định!", { theme: "light" });
    }
  };

  return {
    addresses,
    fetchAddresses,
    showAddressForm,
    setShowAddressForm,
    newAddress,
    setNewAddress,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress,
  };
};

export default useAddressLogic;