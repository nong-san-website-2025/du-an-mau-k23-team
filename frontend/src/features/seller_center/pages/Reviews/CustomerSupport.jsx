// src/features/reviews/pages/CustomerSupport.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const CustomerSupport = () => {
  const [supports, setSupports] = useState([]);
  const [message, setMessage] = useState("");
  const [issueType, setIssueType] = useState("complaint");

  useEffect(() => {
    axios.get("/api/support/")
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setSupports(data);
      })
      .catch(err => console.log(err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    axios.post("/api/support/", { message, issue_type: issueType })
      .then(res => {
        setSupports([...supports, res.data]);
        setMessage("");
      })
      .catch(err => console.log(err));
  };

  return (
    <div>
      <h2>Khiếu nại & phản hồi</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <select value={issueType} onChange={e => setIssueType(e.target.value)} style={{ marginRight: "5px" }}>
          <option value="complaint">Khiếu nại</option>
          <option value="inquiry">Hỏi đáp</option>
          <option value="feedback">Phản hồi</option>
        </select>
        <input 
          type="text" 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          placeholder="Nội dung"
          style={{ marginRight: "5px", padding: "5px", width: "300px" }}
        />
        <button type="submit" style={{ padding: "5px 10px" }}>Gửi</button>
      </form>

      {supports.length === 0 ? <p>Chưa có khiếu nại/phản hồi nào.</p> : (
        <ul>
          {supports.map(s => (
            <li key={s.id}>
              [{s.issue_type}] - {s.message} | {s.is_resolved ? "Đã xử lý" : "Chưa xử lý"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerSupport;
