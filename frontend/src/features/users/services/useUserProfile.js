// src/features/users/services/useUserProfile.js
import { useEffect, useState } from "react";
import API from "../../login_register/services/api";

export default function useUserProfile(shouldFetch = true) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // 🔑 Nếu không nên fetch → đặt profile = null và dừng
    if (!shouldFetch) {
      setProfile(null);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await API.get("users/me/");
        setProfile(res.data);
      } catch (err) {
        setProfile(null);
      }
    };

    fetchProfile();
  }, [shouldFetch]); // 👈 Thêm shouldFetch vào dependency array

  return profile;
}