import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("processing");
  const navigate = useNavigate();

  useEffect(() => {
    const resultCode = searchParams.get("resultCode");
    const orderId = searchParams.get("orderId");
    const message = searchParams.get("message");

    if (resultCode === "0") {
      // Thanh toán thành công
      setStatus("success");

      // Gọi backend confirm thanh toán
      axios.post("http://localhost:8000/api/payment/momo/confirm/", {
        orderId,
      }).catch(err => {
        console.error("Confirm failed:", err);
      });
    } else {
      setStatus("failed");
      console.error("MoMo Payment Failed:", message);
    }
  }, [searchParams]);

  const handleGoOrders = () => {
    navigate("/orders?tab=completed");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <h2 className="text-xl font-semibold">Đang xử lý...</h2>
        )}

        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold text-green-600">Thanh toán thành công!</h2>
            <p className="mt-2">Cảm ơn bạn đã mua hàng qua MoMo.</p>
            <button
              onClick={handleGoOrders}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Xem đơn hàng
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <h2 className="text-2xl font-bold text-red-600">Thanh toán thất bại!</h2>
            <p className="mt-2">Đã có lỗi xảy ra khi thanh toán bằng MoMo.</p>
            <button
              onClick={handleGoHome}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Về trang chủ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
