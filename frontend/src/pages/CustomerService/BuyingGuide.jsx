import React from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  CreditCard,
  CheckCircle,
  Headphones,
  ShieldCheck,
  Truck,
  ThumbsUp,
} from "lucide-react";

const steps = [
  {
    icon: ShoppingCart,
    title: "Chọn sản phẩm yêu thích",
    description:
      "Khám phá danh mục nông sản sạch và sử dụng bộ lọc để tìm nhanh sản phẩm phù hợp với nhu cầu của bạn.",
    badge: "01",
  },
  {
    icon: Package,
    title: "Thêm vào giỏ hàng",
    description:
      "Nhấn \"Thêm vào giỏ\" để lưu sản phẩm. Bạn có thể kiểm tra tồn kho, thay đổi số lượng hoặc bỏ sản phẩm bất cứ lúc nào.",
    badge: "02",
  },
  {
    icon: CreditCard,
    title: "Thanh toán an toàn",
    description:
      "Chọn phương thức thanh toán linh hoạt: tiền mặt khi nhận hàng, chuyển khoản hoặc ví điện tử đã được GreenFarm kiểm định.",
    badge: "03",
  },
  {
    icon: CheckCircle,
    title: "Theo dõi & nhận hàng",
    description:
      "Đơn hàng được đóng gói cẩn thận và cập nhật trạng thái liên tục. Bạn nhận thông báo ngay khi đơn đang giao hoặc đã hoàn tất.",
    badge: "04",
  },
];

const supportHighlights = [
  {
    icon: Headphones,
    title: "Đội ngũ tư vấn tận tâm",
    description:
      "Cam kết phản hồi trong vòng 15 phút qua chat trực tuyến hoặc hotline 0123 456 789.",
  },
  {
    icon: ShieldCheck,
    title: "Bảo mật thanh toán",
    description:
      "Mọi giao dịch được mã hóa chuẩn PCI DSS, đảm bảo an toàn cho thông tin cá nhân của bạn.",
  },
  {
    icon: Truck,
    title: "Giao hàng toàn quốc",
    description:
      "Liên kết với các đơn vị vận chuyển uy tín, giao hàng tận nơi chỉ từ 24h đối với khu vực nội thành.",
  },
  {
    icon: ThumbsUp,
    title: "100% nông sản chuẩn",
    description:
      "Sản phẩm có nguồn gốc rõ ràng, quy trình kiểm định khắt khe trước khi giao đến tay khách hàng.",
  },
];

const tips = [
  {
    title: "Đăng nhập trước khi đặt hàng",
    description:
      "Đăng nhập giúp bạn lưu thông tin nhận hàng, lịch sử mua và điểm thưởng thành viên.",
  },
  {
    title: "Sử dụng bộ lọc thông minh",
    description:
      "Kết hợp các bộ lọc theo giá, đánh giá hoặc nguồn gốc để rút ngắn thời gian tìm sản phẩm.",
  },
  {
    title: "Kiểm tra ưu đãi hiện có",
    description:
      "Khám phá mục \u201cƯu đãi của bạn\u201d tại giỏ hàng để áp voucher hoặc mã giảm giá độc quyền.",
  },
  {
    title: "Theo dõi đơn hàng theo thời gian thực",
    description:
      "Tại mục \u201cĐơn hàng của tôi\u201d, bạn có thể xem trạng thái và thời gian dự kiến giao hàng.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

export default function BuyingGuide() {
  return (
    <section className="bg-gradient-to-b from-green-50 via-white to-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm">
            <ShoppingCart className="h-4 w-4" />
            Quy trình mua sắm cùng GreenFarm
          </span>
          <h1 className="mt-6 text-4xl font-extrabold text-green-700 md:text-5xl">
            Hướng dẫn mua hàng nhanh chóng và thuận tiện
          </h1>
          <p className="mt-4 text-lg text-gray-600 md:text-xl">
            Chỉ với vài bước đơn giản, bạn đã có thể đặt mua nông sản sạch và nhận
            hàng tận nhà. Theo dõi quy trình bên dưới để có trải nghiệm trọn vẹn
            nhất.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
                className="relative flex h-full flex-col rounded-3xl border border-green-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Icon className="h-8 w-8 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
                <div className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white shadow-md">
                  {step.badge}
                </div>
              </motion.div>
            );
          })}
        </div>

      
      </div>
    </section>
  );
}