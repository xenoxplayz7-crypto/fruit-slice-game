export type AdPlacementType =
  | 'banner_home'
  | 'rewarded_extra_life'
  | 'rewarded_unlock_blade'
  | 'interstitial_session_end';

export interface AdSenseConfig {
  clientId: string; // e.g. "ca-pub-1234567890123456"
  bannerSlotId: string;
  rewardedSlotId: string;
  interstitialSlotId: string;
  interstitialFrequencySessions: number; // default: 3
  interstitialCooldownSeconds: number; // default: 90
}

export interface AdNetworkState {
  isConfigured: boolean;
  isApproved: boolean;
  clientId: string;
  bannerSlotId: string;
  rewardedSlotId: string;
  interstitialSlotId: string;
  completedGameSessions: number;
  lastInterstitialTimestamp: number;
  unlockedBlades: string[];
}
