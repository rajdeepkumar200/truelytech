import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.truelytech.habitency',
  appName: 'Habitency',
  webDir: 'dist',
  server: {
    ...(serverUrl ? { url: serverUrl } : {}),
    androidScheme: 'http',
    cleartextTrafficPermitted: true
  }
};

export default config;
