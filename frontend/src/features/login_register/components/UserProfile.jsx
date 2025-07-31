// src/components/UserProfile.jsx
import React, { useEffect, useState } from "react";

function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      console.log("Access token:", token);

      const response = await fetch("http://localhost:8000/api/users/me/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
        
      });
      
        

      const data = await response.json();
      if (response.ok) {
        setUser(data);
      } else {
        console.log("Lỗi xác thực hoặc token hết hạn");
      }
    };

    fetchProfile();
  }, []);

  if (!user) return <p>Đang tải thông tin...</p>;

  return (
    <div>
      <h3>Xin chào: {user.username}</h3>
      <p>Email: {user.email}</p>
    </div>
  );
}

export default UserProfile;
