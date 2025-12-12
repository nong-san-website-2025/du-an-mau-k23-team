// index.js - Export tất cả components, hooks, và utilities

// ============= Pages =============
export { default as UserAdminPage } from "./UserAdminPage";

// ============= Components =============
// UserDetail (Main)
export { default as UserDetailRow } from "./components/UserDetail/UserDetailRow";

// Tabs
export { default as BasicInfoTab } from "./components/UserDetail/tabs/BasicInfoTab";
export { default as BehaviorTab } from "./components/UserDetail/tabs/BehaviorTab";
export { default as ViolationsTab } from "./components/UserDetail/tabs/ViolationsTab";
export { default as OrdersTab } from "./components/UserDetail/tabs/OrdersTab";
export { default as ActivityTab } from "./components/UserDetail/tabs/ActivityTab";
export { default as PaymentTab } from "./components/UserDetail/tabs/PaymentTab";
export { default as MembershipTab } from "./components/UserDetail/tabs/MembershipTab";
export { default as TechnicalTab } from "./components/UserDetail/tabs/TechnicalTab";

// Forms
export { default as UserAddModal } from "./components/UserForms/UserAddModal";
export { default as UserEditForm } from "./components/UserForms/UserEditForm";

// Table
export { default as UserTable } from "./components/UserTable/UserTable";

// Sidebar
export { default as UserSidebar } from "./UserSidebar";

// ============= Hooks =============
export { useUserData } from "./hooks/useUserData";

// ============= API =============
export {
  API_BASE_URL,
  getToken,
  getHeaders,
} from "./api/config";

export {
  fetchRoles,
  createRole,
  fetchUsers,
  fetchUserDetail,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  fetchUserBehavior,
  fetchUserViolations,
  fetchUserOrders,
  fetchUserActivityLog,
  fetchUserPayments,
  fetchUserTechnicalInfo,
} from "./api/userApi";

// ============= Utilities =============
export {
  getTrustScore,
  getTrustScoreColor,
  getTrustScoreLabel,
} from "./components/UserDetail/utils/trustScore";

export {
  getMembershipBadge,
  getNextMembershipLevel,
  getMembershipBenefits,
} from "./components/UserDetail/utils/membershipTier";

export {
  getFrequencyLabel,
  getFrequencyColor,
  getFrequencyScore,
} from "./components/UserDetail/utils/frequency";

export {
  exportUsersToExcel,
  exportUsersToPDF,
} from "./Utils/exportUtils";
