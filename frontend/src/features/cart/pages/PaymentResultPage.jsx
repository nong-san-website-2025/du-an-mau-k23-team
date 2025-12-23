import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function PaymentResultPage() {
	const [searchParams] = useSearchParams();
	const [status, setStatus] = useState("processing");
	const navigate = useNavigate();

	useEffect(() => {
		// Generic handler for different gateways
		const success =
			searchParams.get("resultCode") === "0" ||
			searchParams.get("vnp_ResponseCode") === "00" ||
			searchParams.get("success") === "1";

		setStatus(success ? "success" : "failed");
	}, [searchParams]);

	const goOrders = () => navigate("/orders?tab=completed");
	const goHome = () => navigate("/");

	return (
		<div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
			<div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", maxWidth: 420, width: "100%", textAlign: "center" }}>
				{status === "processing" && <h3>Đang xử lý...</h3>}

				{status === "success" && (
					<>
						<h2 style={{ color: "#389E0D", marginBottom: 8 }}>Thanh toán thành công!</h2>
						<p>Đơn hàng của bạn đã được ghi nhận.</p>
						<button onClick={goOrders} style={{ marginTop: 12, background: "#389E0D", color: "#fff", border: 0, padding: "8px 14px", borderRadius: 6 }}>Xem đơn hàng</button>
					</>
				)}

				{status === "failed" && (
					<>
						<h2 style={{ color: "#dc2626", marginBottom: 8 }}>Thanh toán thất bại</h2>
						<p>Vui lòng thử lại hoặc đổi phương thức thanh toán.</p>
						<button onClick={goHome} style={{ marginTop: 12, background: "#334155", color: "#fff", border: 0, padding: "8px 14px", borderRadius: 6 }}>Về trang chủ</button>
					</>
				)}
			</div>
		</div>
	);
}
