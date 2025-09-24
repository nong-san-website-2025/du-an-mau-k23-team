// src/components/ShippingEstimator.jsx
import React, { useState } from 'react';

export default function ShippingEstimator({ onCreate }) {
  const [to_district_id, setToDistrictId] = useState('');
  const [to_ward_code, setToWardCode] = useState('');
  const [weight, setWeight] = useState(500); // gram
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEstimate = async () => {
    setLoading(true);
    const body = {
      from_district_id: 1454,         // hoặc lấy từ shop config (backend)
      from_ward_code: '21211',
      to_district_id: parseInt(to_district_id, 10),
      to_ward_code,
      weight,
      length: 10, width: 10, height: 10,
      service_id: null
    };
    const res = await fetch('/api/delivery/fee/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setFee(data);
    setLoading(false);
  };

  return (
    <div>
      <input placeholder="to_district_id" value={to_district_id} onChange={e=>setToDistrictId(e.target.value)} />
      <input placeholder="to_ward_code" value={to_ward_code} onChange={e=>setToWardCode(e.target.value)} />
      <input placeholder="weight(g)" value={weight} onChange={e=>setWeight(e.target.value)} />
      <button onClick={handleEstimate} disabled={loading}>Tính phí</button>
      {fee && <pre>{JSON.stringify(fee, null, 2)}</pre>}
    </div>
  );
}
