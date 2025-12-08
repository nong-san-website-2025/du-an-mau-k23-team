import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nongsan.vn",
  appName: "app",
  webDir: "dist",
  server: {
    url: "http://10.0.2.2:8100", // cho emulator
    cleartext: true,
  },
};

export default config;
