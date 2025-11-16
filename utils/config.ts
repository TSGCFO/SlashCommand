import Constants from 'expo-constants';

// Configuration service to handle environment variables properly in React Native
class ConfigService {
  private openAIKey: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Access environment variables through Expo Constants
    // In Replit, environment variables are exposed through the manifest
    try {
      // Try to get from extra config first (app.json/app.config.js)
      const extra = Constants.expoConfig?.extra || Constants.manifest?.extra;
      if (extra?.OPENAI_API_KEY) {
        this.openAIKey = extra.OPENAI_API_KEY;
        console.log('OpenAI API key loaded from expo config extra');
        return;
      }

      // Try to get from manifest2 (EAS Update)
      if (Constants.manifest2?.extra?.OPENAI_API_KEY) {
        this.openAIKey = Constants.manifest2.extra.OPENAI_API_KEY;
        console.log('OpenAI API key loaded from manifest2');
        return;
      }

      // In development, try to access from process.env (web only)
      if (__DEV__ && typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) {
        this.openAIKey = process.env.OPENAI_API_KEY;
        console.log('OpenAI API key loaded from process.env (web)');
        return;
      }

      // For Replit environment, we need to use a different approach
      // The environment variables should be exposed through the Replit secrets
      // and accessible via the Constants module
      const replitEnv = (Constants as any).systemFonts || {};
      if (replitEnv.OPENAI_API_KEY) {
        this.openAIKey = replitEnv.OPENAI_API_KEY;
        console.log('OpenAI API key loaded from Replit environment');
        return;
      }

      console.log('No OpenAI API key found in environment');
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  getOpenAIKey(): string | null {
    return this.openAIKey;
  }

  hasOpenAIKey(): boolean {
    return !!this.openAIKey;
  }

  // For debugging - log available configuration sources
  debugConfig() {
    console.log('=== Configuration Debug Info ===');
    console.log('Constants.expoConfig:', Constants.expoConfig);
    console.log('Constants.manifest:', Constants.manifest);
    console.log('Constants.manifest2:', Constants.manifest2);
    console.log('OpenAI Key present:', this.hasOpenAIKey());
    console.log('================================');
  }
}

// Create singleton instance
const configService = new ConfigService();

// Export for use throughout the app
export default configService;