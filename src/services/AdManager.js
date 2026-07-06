export class AdManager {
  constructor() {
    this.lastAdAt = 0;
  }

  async preload() {
    // TODO(Douyin SDK): create rewarded video, interstitial, and banner ad instances here.
    return { rewarded: false, interstitial: false, banner: false };
  }

  async showRewardedVideo(reason = 'optional-enhancement') {
    // TODO(Douyin SDK): call tt.createRewardedVideoAd and grant reward only on completed close event.
    return { shown: false, rewarded: false, reason: 'douyin-sdk-not-configured', requestReason: reason };
  }

  async maybeShowInterstitial(context = 'mode-switch') {
    // TODO(Douyin SDK): show low-frequency interstitial during mode switches after cooldown.
    const now = Date.now();
    if (now - this.lastAdAt < 60_000) return { shown: false, reason: 'cooldown', context };
    this.lastAdAt = now;
    return { shown: false, reason: 'douyin-sdk-not-configured', context };
  }
}
