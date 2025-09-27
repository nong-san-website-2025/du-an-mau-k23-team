// components/CountdownTimer.jsx
import React from 'react';

const CountdownTimer = ({ timeLeft }) => {
  const formatTime = (seconds) => {
    if (seconds <= 0) return { h: '00', m: '00', s: '00' };
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return { h, m, s };
  };

  const { h, m, s } = formatTime(timeLeft);

  if (timeLeft <= 0) {
    return (
      <div className="flash-countdown-expired">
        ĐÃ HẾT GIỜ!
      </div>
    );
  }

  return (
    <div className="flash-countdown d-flex align-items-center">
      <div className="flash-countdown-unit">
        <div className="flash-countdown-value">{h}</div>

      </div>
      <div className="flash-countdown-separator">:</div>
      <div className="flash-countdown-unit">
        <div className="flash-countdown-value">{m}</div>

      </div>
      <div className="flash-countdown-separator">:</div>
      <div className="flash-countdown-unit">
        <div className="flash-countdown-value">{s}</div>

      </div>

      <style jsx>{`
        .flash-countdown {
          background: #fff8e1;
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 6px 12px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(255, 193, 7, 0.3);
        }
        .flash-countdown-unit {
          text-align: center;
          min-width: 50px;
        }
        .flash-countdown-value {
          font-size: 1.2rem;
          color: #e65100;
          font-weight: 700;
          background: white;
          padding: 4px 0;
          border-radius: 4px;
          box-shadow: inset 0 -2px 0 rgba(0,0,0,0.1);
        }
        .flash-countdown-label {
          font-size: 0.7rem;
          color: #5d4037;
          margin-top: 2px;
          text-transform: uppercase;
        }
        .flash-countdown-separator {
          font-size: 1.4rem;
          color: #ff6f00;
          margin: 0 6px;
          font-weight: bold;
        }
        .flash-countdown-expired {
          background: #ffebee;
          color: #c62828;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          border: 1px solid #ffcdd2;
        }
      `}</style>
    </div>
  );
};

export default CountdownTimer;