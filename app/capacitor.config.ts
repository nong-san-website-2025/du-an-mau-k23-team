import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vn.nongsan',   // ✅ App ID (package name, dạng duy nhất)
  appName: 'app',     // ✅ Tên app hiển thị trên điện thoại
  webDir: 'dist',            // hoặc 'build' nếu bạn dùng CRA (create-react-app)
  bundledWebRuntime: false,
};

export default config;
