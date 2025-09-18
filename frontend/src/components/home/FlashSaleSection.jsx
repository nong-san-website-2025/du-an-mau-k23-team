import { useState, useEffect } from "react";
import { Button } from "antd";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export default function FlashSaleSection() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Giả lập dữ liệu flash sale cứng
  const flashSaleProducts = [
    {
      id: 1,
      name: "Táo Mỹ",
      price: 120000,
      discountPrice: 90000,
      image: "https://via.placeholder.com/150x150?text=Tao+My",
    },
    {
      id: 2,
      name: "Cam Sành",
      price: 80000,
      discountPrice: 60000,
      image: "https://via.placeholder.com/150x150?text=Cam+Sanh",
    },
    {
      id: 3,
      name: "Gạo ST25",
      price: 25000,
      discountPrice: 19000,
      image: "https://via.placeholder.com/150x150?text=Gao+ST25",
    },
    {
      id: 4,
      name: "Xoài Cát Chu",
      price: 100000,
      discountPrice: 75000,
      image: "https://via.placeholder.com/150x150?text=Xoai+Cat+Chu",
    },
    {
      id: 5,
      name: "Thanh Long Ruột Đỏ",
      price: 60000,
      discountPrice: 45000,
      image: "https://via.placeholder.com/150x150?text=Thanh+Long",
    },
    {
      id: 6,
      name: "Mật Ong Rừng",
      price: 180000,
      discountPrice: 150000,
      image: "https://via.placeholder.com/150x150?text=Mat+Ong",
    },
  ];

  // Gán cứng giờ kết thúc flash sale (ví dụ sau 3 giờ kể từ thời điểm hiện tại)
  const flashSaleEndTime = dayjs().add(3, "hour");

  // Cập nhật countdown mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      const now = dayjs();
      const diff = flashSaleEndTime.diff(now);

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const dur = dayjs.duration(diff);
        setTimeLeft({
          hours: dur.hours(),
          minutes: dur.minutes(),
          seconds: dur.seconds(),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSaleEndTime]);

  return (
    <div className="flash-sale-section mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <h3 className="mb-0 me-3 text-danger fw-bold">Flash Sale</h3>
          <div className="countdown d-flex">
            <div className="time-box">{timeLeft.hours.toString().padStart(2, "0")}</div>
            <span className="separator">:</span>
            <div className="time-box">{timeLeft.minutes.toString().padStart(2, "0")}</div>
            <span className="separator">:</span>
            <div className="time-box">{timeLeft.seconds.toString().padStart(2, "0")}</div>
          </div>
        </div>
        <Button type="link" className="see-all-btn text-danger fw-bold">
          Xem tất cả
        </Button>
      </div>

      {/* Product Grid */}
      <div className="row">
        {flashSaleProducts.slice(0, 6).map((product) => (
          <div key={product.id} className="col-6 col-md-4 col-lg-2 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <img
                src={product.image}
                alt={product.name}
                className="card-img-top"
                style={{ objectFit: "cover", height: "150px" }}
              />
              <div className="card-body p-2">
                <h6 className="card-title text-truncate">{product.name}</h6>
                <p className="mb-1 text-danger fw-bold">
                  {product.discountPrice.toLocaleString()} đ
                </p>
                <small className="text-muted text-decoration-line-through">
                  {product.price.toLocaleString()} đ
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .countdown .time-box {
          background: #ff4d4f;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
          margin: 0 2px;
          min-width: 32px;
          text-align: center;
        }
        .countdown .separator {
          font-weight: bold;
          color: #ff4d4f;
          margin: 0 4px;
        }
        .see-all-btn {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
