import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.truelytech.habitency',
  appName: 'Habitency',
  webDir: 'dist',
  server: {
    ...(serverUrl ? { url: serverUrl } : {}),
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '536614179434-rnpenriej85hsq22inquikr3ekgubnh6.apps.googleusercontent.com',
    }
  }
};

export default config;
