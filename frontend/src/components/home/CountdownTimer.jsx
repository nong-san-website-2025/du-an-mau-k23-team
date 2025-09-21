// components/CountdownTimer.jsx
import React from 'react';

const CountdownTimer = ({ timeLeft }) => {
  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (timeLeft <= 0) {
    return <div className="alert alert-warning text-center">Đã hết giờ!</div>;
  }

  return (
    <div className="text-center bg-danger text-white py-2 rounded mb-3">
      <small>Còn lại:</small> <strong>{formatTime(timeLeft)}</strong>
    </div>
  );
};

export default CountdownTimer;