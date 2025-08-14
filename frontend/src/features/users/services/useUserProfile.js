import { useEffect, useState } from "react";
import API from "../../login_register/services/api";

export default function useUserProfile() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await API.get("users/me/");
        setProfile(res.data);
      } catch (err) {
        setProfile(null);
      }
    }
    if (localStorage.getItem("token")) fetchProfile();
  }, []);
  return profile;
}
