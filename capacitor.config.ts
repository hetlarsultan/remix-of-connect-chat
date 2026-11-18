import type { CapacitorConfig } from '@capacitor/cli';

// The web app renders on the server, so the build has no static index.html for the
// Android WebView. The app therefore loads the published site directly.
const config: CapacitorConfig = {
  appId: 'com.yourcompany.chat',
  appName: 'شات عالمي',
  webDir: 'dist/client',
  server: {
    url: 'https://project--6b63b8a6-e865-46f0-971e-30a877315af0.lovable.app',
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
