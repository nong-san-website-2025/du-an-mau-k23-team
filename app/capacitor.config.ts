import type { CapacitorConfig } from "@capacitor/cli";  

const config: CapacitorConfig = {
  appId: "com.nongsan.vn",
  appName: "app",
  webDir: "dist",
  server: {
    url: 'http://192.168.89.159:8100',
    cleartext: true,
  },
};

export default config;
