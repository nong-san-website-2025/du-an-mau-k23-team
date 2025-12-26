import type { CapacitorConfig } from "@capacitor/cli";  

const config: CapacitorConfig = {
  appId: "com.nongsan.vn",
  appName: "app",
  webDir: "dist",
  server: {
    url: 'http://172.16.102.132:8100',
    cleartext: true,
  },
};

export default config;
