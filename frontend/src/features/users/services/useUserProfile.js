import { useEffect, useState } from "react";
import { api } from "../../login_register/services/AuthContext";

export default function useUserProfile() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("users/me/");
        setProfile(res.data);
      } catch (err) {
        setProfile(null);
      }
    }
    if (localStorage.getItem("token")) fetchProfile();
  }, []);
  return profile;
}
