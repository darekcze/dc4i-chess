import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.dc4i.szachy',
  appName: 'Szachy',
  webDir: 'dist',
  backgroundColor: '#0c1220',
  plugins: {
    SplashScreen: { launchAutoHide: true, backgroundColor: '#0c1220', showSpinner: false },
  },
}

export default config
