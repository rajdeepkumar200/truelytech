import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.truelytech.habits',
  appName: 'TruelyTech Habits',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartextTrafficPermitted: true
  }
};

export default config;
