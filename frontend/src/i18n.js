import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Tài nguyên dịch
const resources = {
  vi: {
    translation: {
      // ===== SIDEBAR =====
      Dashboard: "Bảng điều khiển",
      Users: "Người dùng",
      User_manage: "Quản lý người dùng",
      Shops: "Cửa hàng",
      Shops_active_blocked: "Cửa hàng hoạt động / bị khoá",
      Approve_shops: "Duyệt cửa hàng",
      Products_categories: "Sản phẩm & Danh mục",
      Approve_products: "Duyệt sản phẩm",
      Manage_categories: "Quản lý danh mục",
      Manage_brands: "Quản lý thương hiệu",
      Violations: "Sản phẩm vi phạm",
      Orders_shipping: "Đơn hàng & Vận chuyển",
      Order_monitor: "Giám sát đơn hàng",
      Shipping_partners: "Đối tác vận chuyển",
      Payments: "Thanh toán",
      Transactions: "Giao dịch",
      Wallets: "Ví tiền Seller",
      Revenue: "Đối soát doanh thu",
      Fraud: "Phát hiện gian lận",
      Reports: "Thống kê & Báo cáo",
      Report_revenue: "Doanh thu",
      Report_top_products: "Sản phẩm bán chạy",
      Report_cancel_rate: "Tỉ lệ huỷ / hoàn đơn",
      Marketing: "Marketing",
      Banner: "Banner quảng cáo",
      Flash_sale: "Flash Sale / Chiến dịch",

      // ===== USERS PAGE =====
      users_page: {
        title: "Quản lý người dùng",
        search_placeholder: "Tìm kiếm người dùng",
        add_user: "Thêm người dùng",
        delete_selected: "Xoá đã chọn",
        help: "Trợ giúp",
        table: {
          username: "Tên đăng nhập",
          fullname: "Họ và tên",
          email: "Email",
          phone: "Số điện thoại",
          role: "Vai trò",
          status: "Trạng thái",
          actions: "Hành động",
          no_data: "Không có dữ liệu",
          loading: "Đang tải...",
        },
        detail: {
          user_info: "Thông tin người dùng",
          edit_user: "Chỉnh sửa người dùng",
          edit: "Chỉnh sửa",
          close: "Đóng",
          active: "Đang hoạt động",
          inactive: "Ngừng hoạt động",
          not_available: "Không có dữ liệu",
        },
      },
      //    ===== USER DETAIL MODAL =====
      detail_modal: {
        edit: "Sửa",
        close: "Đóng",
        detail: "Chi tiết",
        edit_user: "Chỉnh sửa người dùng",
        user_info: "Thông tin người dùng",
        not_available: "Không có",
        active: "Đang hoạt động",
        inactive: "Không hoạt động",
      },
      

      // ===== SELLER PAGE =====
      sellers_page: {
        title: "Tài khoản cửa hàng",
        search_placeholder: "Tìm kiếm cửa hàng hoặc email",
        id: "ID",
        shop_name: "Tên cửa hàng",
        owner: "Người đăng ký",
        email: "Email",
        status: "Trạng thái",
        created_at: "Ngày đăng ký",
        actions: "Hành động",
        active: "Đang hoạt động",
        inactive: "Đã bị khoá",
      },

      // ===== ORDERS PAGE =====
      orders_page: {
        title: "Quản lý đơn hàng",
        search_placeholder: "Tìm kiếm theo mã đơn",
        id: "Mã đơn",
        customer: "Khách hàng",
        total: "Tổng tiền",
        status: "Trạng thái",
        created_at: "Ngày tạo",
        actions: "Hành động",
        pending: "Đang xử lý",
        shipped: "Đã giao",
        cancelled: "Đã huỷ",
      },

      // ===== PAYMENTS PAGE =====
      payments_page: {
        title: "Thanh toán",
        transactions: "Giao dịch",
        wallets: "Ví Seller",
        revenue: "Đối soát doanh thu",
        fraud: "Phát hiện gian lận",
        table: {
          id: "Mã",
          type: "Loại",
          amount: "Số tiền",
          status: "Trạng thái",
          created_at: "Ngày tạo",
        },
      },

      // ===== REPORTS PAGE =====
      reports_page: {
        title: "Thống kê & Báo cáo",
        revenue: "Doanh thu",
        top_products: "Sản phẩm bán chạy",
        cancel_rate: "Tỉ lệ huỷ/hoàn",
      },

      // ===== MARKETING PAGE =====
      marketing_page: {
        title: "Chiến dịch Marketing",
        banners: "Banner quảng cáo",
        flash_sale: "Flash Sale / Campaign",
      },
      sellers_active_locked: {
        title: "Tài khoản đang hoạt động / bị khóa",
        search_placeholder: "Tìm kiếm theo tên cửa hàng hoặc email",
        load_failed: "Không tải được danh sách người bán",
        locked: "Đã khóa tài khoản: {{name}}",
        unlocked: "Đã mở khóa tài khoản: {{name}}",
        action_failed: "Thao tác thất bại",
        detail_title: "Chi tiết cửa hàng: {{name}}",
        no_image: "Không có hình",
        store_name: "Tên cửa hàng",
        owner: "Chủ sở hữu",
        phone: "Điện thoại",
        address: "Địa chỉ",
        status: "Trạng thái",
        created_at: "Ngày tạo",
        bio: "Giới thiệu",
      },
      // --- User Sidebar ---
      user_sidebar: {
        users: "Người dùng",
        role: "Vai trò",
        create_role: "Tạo vai trò",
        all_roles: "Tất cả vai trò",
        create_new_role: "Tạo vai trò mới",
        role_name: "Tên vai trò",
        cancel: "Hủy",
        create: "Tạo",
        creating: "Đang tạo...",
        please_enter_role_name: "Vui lòng nhập tên vai trò",
        create_role_success: "Tạo vai trò thành công",
        create_role_error: "Lỗi khi tạo vai trò: {{error}}",
        // ...
      },
    },
  },

  en: {
    translation: {
      // ===== SIDEBAR =====
      Dashboard: "Dashboard",
      Users: "Users",
      User_manage: "Manage Users",
      Shops: "Shops",
      Shops_active_blocked: "Active / Blocked Shops",
      Approve_shops: "Approve Shops",
      Products_categories: "Products & Categories",
      Approve_products: "Approve Products",
      Manage_categories: "Manage Categories",
      Manage_brands: "Manage Brands",
      Violations: "Violation Products",
      Orders_shipping: "Orders & Shipping",
      Order_monitor: "Order Monitoring",
      Shipping_partners: "Shipping Partners",
      Payments: "Payments",
      Transactions: "Transactions",
      Wallets: "Seller Wallets",
      Revenue: "Revenue Reconciliation",
      Fraud: "Fraud Detection",
      Reports: "Reports & Analytics",
      Report_revenue: "Revenue",
      Report_top_products: "Top Products",
      Report_cancel_rate: "Cancel / Return Rate",
      Marketing: "Marketing",
      Banner: "Ad Banners",
      Flash_sale: "Flash Sale / Campaign",

      // ===== USERS PAGE =====
      users_page: {
        title: "User Management",
        search_placeholder: "Search users",
        add_user: "Add User",
        delete_selected: "Delete Selected",
        help: "Help",
        table: {
          username: "Username",
          fullname: "Full Name",
          email: "Email",
          phone: "Phone",
          role: "Role",
          status: "Status",
          actions: "Actions",
          no_data: "No data",
          loading: "Loading...",
        },
      },
      //   ===== USER DETAIL MODAL =====
      detail_modal: {
        edit: "Edit",
        close: "Close",
        detail: "Detail",
        edit_user: "Edit User",
        user_info: "User Information",
        not_available: "Not available",
        active: "Active",
        inactive: "Inactive",
      },
      user_sidebar: {
        users: "Users",
        role: "Role",
        create_role: "Create role",
        all_roles: "All roles",
        create_new_role: "Create new role",
        role_name: "Role name",
        cancel: "Cancel",
        create: "Create",
        creating: "Creating...",
        please_enter_role_name: "Please enter role name",
        create_role_success: "Role created successfully",
        create_role_error: "Failed to create role: {{error}}",
      },

      // ===== SELLER PAGE =====
      sellers_page: {
        title: "Shop Accounts",
        search_placeholder: "Search by shop name or email",
        id: "ID",
        shop_name: "Shop Name",
        owner: "Owner",
        email: "Email",
        status: "Status",
        created_at: "Registered At",
        actions: "Actions",
        active: "Active",
        inactive: "Blocked",
      },

      // ===== ORDERS PAGE =====
      orders_page: {
        title: "Order Management",
        search_placeholder: "Search by order ID",
        id: "Order ID",
        customer: "Customer",
        total: "Total",
        status: "Status",
        created_at: "Created At",
        actions: "Actions",
        pending: "Pending",
        shipped: "Shipped",
        cancelled: "Cancelled",
      },

      // ===== PAYMENTS PAGE =====
      payments_page: {
        title: "Payments",
        transactions: "Transactions",
        wallets: "Seller Wallets",
        revenue: "Revenue Reconciliation",
        fraud: "Fraud Detection",
        table: {
          id: "ID",
          type: "Type",
          amount: "Amount",
          status: "Status",
          created_at: "Created At",
        },
      },

      // ===== REPORTS PAGE =====
      reports_page: {
        title: "Reports & Analytics",
        revenue: "Revenue",
        top_products: "Top Products",
        cancel_rate: "Cancel / Return Rate",
      },

      // ===== MARKETING PAGE =====
      marketing_page: {
        title: "Marketing Campaigns",
        banners: "Ad Banners",
        flash_sale: "Flash Sale / Campaign",
      },
      sellers_active_locked: {
        title: "Active / Locked Accounts",
        search_placeholder: "Search by shop name or email",
        load_failed: "Failed to load sellers",
        locked: "Account locked: {{name}}",
        unlocked: "Account unlocked: {{name}}",
        action_failed: "Action failed",
        detail_title: "Shop details: {{name}}",
        no_image: "No image",
        store_name: "Store Name",
        owner: "Owner",
        phone: "Phone",
        address: "Address",
        status: "Status",
        created_at: "Created At",
        bio: "Bio",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "vi",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "htmlTag", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
