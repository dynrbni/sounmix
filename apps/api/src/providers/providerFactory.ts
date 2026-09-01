export class ProviderFactory {
  static getProvider(platform: 'spotify' | 'apple-music') {
    return { platform, isReady: true }
  }
}
