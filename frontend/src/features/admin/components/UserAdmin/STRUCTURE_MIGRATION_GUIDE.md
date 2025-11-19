// UserAdmin Structure & Migration Guide
// ===================================

// OLD STRUCTURE:
// ├── UserAdminPage.jsx
// ├── UserTable.jsx
// ├── UserAddModal.jsx
// ├── UserEditForm.jsx
// ├── UserTableRow.jsx (DELETED)
// ├── UserTableActions.jsx (DELETED)
// ├── UserCreateForm.jsx (DELETED)
// ├── UserSidebar.jsx
// └── Utils/
//     └── exportUtils.js

// NEW STRUCTURE:
// ├── UserAdminPage.jsx (UPDATED - Use new imports)
// ├── UserSidebar.jsx
// │
// ├── components/
// │   ├── UserDetail/
// │   │   ├── UserDetailRow.jsx (MAIN - 8 tabs)
// │   │   ├── tabs/
// │   │   │   ├── BasicInfoTab.jsx
// │   │   │   ├── BehaviorTab.jsx
// │   │   │   ├── ViolationsTab.jsx
// │   │   │   ├── OrdersTab.jsx
// │   │   │   ├── ActivityTab.jsx
// │   │   │   ├── PaymentTab.jsx
// │   │   │   ├── MembershipTab.jsx
// │   │   │   └── TechnicalTab.jsx
// │   │   └── utils/
// │   │       ├── trustScore.js
// │   │       ├── membershipTier.js
// │   │       └── frequency.js
// │   │
// │   ├── UserForms/
// │   │   ├── UserAddModal.jsx (UPDATED)
// │   │   └── UserEditForm.jsx (UPDATED)
// │   │
// │   └── UserTable/
// │       └── UserTable.jsx (UPDATED - Use new imports)
// │
// ├── hooks/
// │   └── useUserData.js (NEW - Custom hook)
// │
// ├── api/
// │   ├── config.js (NEW - API config)
// │   └── userApi.js (NEW - All API calls)
// │
// ├── Utils/
// │   └── exportUtils.js (KEPT - Export functions)
// │
// └── styles/
//     └── modal-custom.css

// ==============================================
// MIGRATION STEPS FOR USAGEADMINPAGE.JSX
// ==============================================

// 1. Update imports:
import UserSidebar from "./UserSidebar";
import UserTable from "./components/UserTable/UserTable";
import UserDetailRow from "./components/UserDetail/UserDetailRow";
import { fetchRoles, fetchUsers } from "./api/userApi";

// 2. Replace fetch calls with API functions:
// OLD: fetch("http://localhost:8000/api/users/roles/list/", ...)
// NEW: const roles = await fetchRoles();

// 3. Use custom hooks where needed:
// import { useUserData } from "./hooks/useUserData";
