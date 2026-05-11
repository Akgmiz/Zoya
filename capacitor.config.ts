import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rosy.ai',
  appName: 'Rosy Elite',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
