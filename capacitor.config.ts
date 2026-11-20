import type { CapacitorConfig } from '@capacitor/cli';

// The Android app runs from the bundled web build in dist/client (no remote server.url).
// Build it with `CAPACITOR_BUILD=1 npm run build`, which also emits the static
// dist/client/index.html app shell, then run `npx cap sync android`.
const config: CapacitorConfig = {
  appId: 'com.yourcompany.chat',
  appName: 'شات عالمي',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https',
  },
};

export default config;
