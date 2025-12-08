import React, { useEffect, useState } from 'react';

const CountdownTimer = ({ endTime }) => {
  const calculateTimeLeft = () => {
    if (!endTime) return 0;
    const diff = Math.floor((new Date(endTime) - new Date()) / 1000);
    return Math.max(0, diff);
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return { h, m, s };
  };

  const { h, m, s } = formatTime(timeLeft);

  if (timeLeft <= 0) {
    return <span className="timer-ended">Đã kết thúc</span>;
  }

  return (
    <div className="countdown-wrapper">
      <div className="time-block">{h}</div>
      <span className="colon">:</span>
      <div className="time-block">{m}</div>
      <span className="colon">:</span>
      <div className="time-block">{s}</div>

      <style jsx>{`
        .countdown-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .time-block {
          background-color: #333; /* Màu đen xám chuyên nghiệp hoặc dùng #ff4d4f */
          color: #fff;
          font-weight: 700;
          font-size: 1rem;
          line-height: 1;
          padding: 6px 8px;
          border-radius: 4px;
          min-width: 32px;
          text-align: center;
        }
        .colon {
          font-weight: 700;
          color: #333;
          font-size: 1.2rem;
          margin-top: -2px;
        }
        .timer-ended {
          color: #999;
          font-weight: 500;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default CountdownTimer;