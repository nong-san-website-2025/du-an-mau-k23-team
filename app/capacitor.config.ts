import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nongsan.vn",
  appName: "app",
  webDir: "dist",
  server: {
    url: "http://192.168.68.117:8100", // cho emulator
    cleartext: true,
  },
};

export default config;
