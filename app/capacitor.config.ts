import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nongsan.vn",
  appName: "app",
  webDir: "dist",
  server: {
    url: "http://172.18.96.1:8100/", // cho emulator
    cleartext: true,
  },
};

export default config;
