import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor native shell config — Android + iOS.
 *
 * `appId` Play/App Store par permanent hota hai, isliye pehli release se pehle confirm karo.
 * Web build (`dist/`) hi dono platforms par chalta hai — koi alag native code nahi.
 */
const config: CapacitorConfig = {
  appId: 'com.webufire.foodiehub',
  appName: 'Foodie Hub',
  webDir: 'dist',
  backgroundColor: '#0e1014',
  server: {
    // Dono platforms ka origin `https://localhost` — Firebase Auth mein `localhost`
    // authorized domain add karna zaroori hai (Google sign-in ke liye).
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: false, // NativeBridge first paint ke baad hide karta hai
      backgroundColor: '#0e1014',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0e1014',
      overlaysWebView: false,
    },
  },
}

export default config
