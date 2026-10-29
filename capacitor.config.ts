/* Configura cómo se empaqueta la aplicación para el teléfono. */
// importante para configuracion android
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.menteactiva.app',
  appName: 'Mente Activa',
  webDir: 'dist',
  server: {
    url: 'http://10.16.2.19:5173',
    cleartext: true,
  },
};

export default config;
