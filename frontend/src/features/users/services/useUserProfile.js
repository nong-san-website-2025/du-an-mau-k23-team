// src/features/users/services/useUserProfile.js
import { useEffect, useState } from "react";
import API from "../../login_register/services/api";

export default function useUserProfile(shouldFetch = true) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {

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
        console.error(
          "❌ Lỗi khi fetch profile:",
          err.response?.status,
          err.response?.data || err.message
        );
        setProfile(null);
      }
    };

    fetchProfile();
  }, [shouldFetch]);

  // Listen for profile updates (avatar changes, etc.)
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      const updatedData = event.detail;
      if (updatedData) {
        setProfile((prev) => {
          return prev ? { ...prev, ...updatedData } : updatedData;
        });
      }
    };

    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  return profile;
}
