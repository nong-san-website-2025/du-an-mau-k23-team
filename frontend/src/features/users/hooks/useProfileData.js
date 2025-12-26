// src/hooks/useProfileData.js
import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../login_register/services/api";
import { notification } from 'antd';
import { formatPhoneNumber } from "../../../services/firebasePhoneAuth";

const useProfileData = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Follow stats + lists + modals
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);

  // --- API Calls ---

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await API.get("users/me/");
      setUser(res.data);
      setForm(res.data);
      // Load follow stats and lists
      await fetchFollowStats();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowStats = async () => {
    try {
      const followingRes = await API.get("sellers/my/following/");
      const following = Array.isArray(followingRes.data)
        ? followingRes.data
        : followingRes.data?.results || [];
      setFollowingList(following);
      setFollowingCount(following.length);
    } catch {
      setFollowingCount(0);
      setFollowingList([]);
    }
    try {
      const followersRes = await API.get("sellers/my/followers/");
      const followers = Array.isArray(followersRes.data)
        ? followersRes.data
        : followersRes.data?.results || [];
      setFollowersList(followers);
      setFollowersCount(followers.length);
    } catch {
      setFollowersCount(0);
      setFollowersList([]);
    }
  };

  // --- Handlers ---

  const handleUnfollow = async (sellerId) => {
    const prevList = followingList;
    const prevCount = followingCount;
    // Optimistic update
    setFollowingList(prevList.filter((s) => s.id !== sellerId));
    setFollowingCount(Math.max(0, prevCount - 1));
    try {
      await API.delete(`sellers/${sellerId}/follow/`);
      toast.info("Đã hủy theo dõi");
    } catch (err) {
      // Revert on failure
      setFollowingList(prevList);
      setFollowingCount(prevCount);
      toast.error("Hủy theo dõi thất bại. Vui lòng thử lại!");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files && files[0])
      setForm((prev) => ({ ...prev, avatar: files[0] }));
    else setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAvatar = async () => {
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("avatar", form.avatar);

      const res = await API.post("users/upload-avatar/", formData);
      
      // Update local state with new avatar URL
      const updatedUser = { ...user, avatar: res.data.avatar };
      setUser(updatedUser);
      setForm(updatedUser);
      
      // Broadcast update event
      window.dispatchEvent(
        new CustomEvent("userProfileUpdated", { detail: updatedUser })
      );
      
      notification.success({
        message: "Cập nhật ảnh đại diện thành công",
        duration: 3,
      });
    } catch (error) {
      console.error("Update avatar error:", error.response || error);
      setError("Cập nhật ảnh thất bại. Vui lòng thử lại!");
      toast.error("❌ Cập nhật ảnh thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e, fieldName) => {
    e.preventDefault();
    
    // Use dedicated avatar upload endpoint for avatar updates
    if (fieldName === "avatar" && form.avatar instanceof File) {
      return handleSaveAvatar();
    }
    
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      
      // Always append username as it's required
      formData.append("username", form.username || user?.username || "");
      
      // Append other fields if they have values
      if (form.full_name !== undefined && form.full_name !== null) {
        formData.append("full_name", form.full_name);
      }
      if (form.email !== undefined && form.email !== null) {
        formData.append("email", form.email);
      }
      if (form.phone !== undefined && form.phone !== null) {
        const formattedPhone = formatPhoneNumber(form.phone);
        formData.append("phone", formattedPhone);
      }
      if (form.avatar instanceof File) {
        formData.append("avatar", form.avatar);
      }

      const res = await API.patch("users/me/", formData);
      setEditMode(false);
      setUser(res.data);
      setForm(res.data);
      // Sync username globally
      if (res.data?.username)
        localStorage.setItem("username", res.data.username);
      // Broadcast update event
      window.dispatchEvent(
        new CustomEvent("userProfileUpdated", { detail: res.data })
      );
      notification.info({
        theme: "light",
        autoClose: 5000,
        message: "Cập nhật thành công",
      });
    } catch (error) {
      console.error("Update profile error:", error.response || error);
      setError("Cập nhật thất bại. Vui lòng thử lại!");
      toast.error("❌ Cập nhật thất bại!");
    } finally {
      setSaving(false);
    }
  };

  // --- Lifecycle ---

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    fetchProfile();
    
    // Check for tab from location.state (navigate with state)
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    } else {
      // Otherwise check URL search params
      const tabParam = searchParams.get("tab");
      if (tabParam) setActiveTab(tabParam);
    }
  }, [searchParams, location.state]);

  return {
    activeTab,
    setActiveTab,
    user,
    loading,
    editMode,
    setEditMode,
    form,
    setForm,
    saving,
    error,
    handleChange,
    handleSave,
    // Follow
    followingCount,
    followersCount,
    followingList,
    followersList,
    showFollowingModal,
    setShowFollowingModal,
    showFollowersModal,
    setShowFollowersModal,
    handleUnfollow,
    fetchProfile, // Export to allow refresh if needed
  };
};

export default useProfileData;