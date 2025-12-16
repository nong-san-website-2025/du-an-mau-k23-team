// src/hooks/useProfileData.js
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../login_register/services/api";
import { notification } from 'antd';

const useProfileData = () => {
  const [searchParams] = useSearchParams();
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

  // Member tier stats
  const [memberTier, setMemberTier] = useState(null);
  const [memberTierColor, setMemberTierColor] = useState("default");
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

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
      // Load member tier stats
      await fetchMemberTierStats();
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

  const calculateMemberTier = (orderCount, spent) => {
    const spentAmount = parseFloat(spent || 0);
    
    if (orderCount >= 50 && spentAmount >= 10000000) {
      return { tier: "Kim cương", color: "gold" };
    } else if (orderCount >= 25 && spentAmount >= 10000000) {
      return { tier: "Vàng", color: "gold" };
    } else if (orderCount >= 10 && spentAmount >= 250000) {
      return { tier: "Bạc", color: "silver" };
    } else {
      return { tier: "Thành viên", color: "default" };
    }
  };

  const fetchMemberTierStats = async () => {
    try {
      const ordersRes = await API.get("orders/");
      const allOrders = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : ordersRes.data?.results || [];
      
      const successStatuses = ['success', 'delivered', 'shipping', 'out_for_delivery', 'ready_to_pick', 'picking'];
      const successOrders = allOrders.filter(order => successStatuses.includes(order.status));
      
      const orderCount = successOrders.length;
      const spent = successOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
      
      setTotalOrders(orderCount);
      setTotalSpent(spent);
      
      const tierInfo = calculateMemberTier(orderCount, spent);
      setMemberTier(tierInfo.tier);
      setMemberTierColor(tierInfo.color);
    } catch (err) {
      console.error("Error fetching member tier stats:", err);
      setMemberTier("Thành viên");
      setMemberTierColor("default");
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", form.username || "");
      formData.append("full_name", form.full_name || "");
      formData.append("email", form.email || "");
      formData.append("phone", form.phone || "");
      if (form.avatar instanceof File) formData.append("avatar", form.avatar);

      const res = await API.put("users/me/", formData);
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
    } catch {
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
    const tabParam = searchParams.get("tab");
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

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
    // Member tier
    memberTier,
    memberTierColor,
    totalOrders,
    totalSpent,
  };
};

export default useProfileData;