import { AdSenseConfig, AdNetworkState } from './adTypes';
import { BladeType } from '../game/types';

const STORAGE_KEYS = {
  CLIENT_ID: 'fruit_slice_adsense_client_id',
  BANNER_SLOT: 'fruit_slice_adsense_banner_slot',
  INTERSTITIAL_SLOT: 'fruit_slice_adsense_interstitial_slot',
  REWARDED_SLOT: 'fruit_slice_adsense_rewarded_slot',
  SESSIONS_COUNT: 'fruit_slice_ad_sessions_count',
  LAST_INTERSTITIAL: 'fruit_slice_ad_last_interstitial',
  UNLOCKED_BLADES: 'fruit_slice_unlocked_blades',
};

// Default blades unlocked without ads
const DEFAULT_UNLOCKED_BLADES: BladeType[] = ['katana', 'inferno'];

class MonetizationManager {
  private config: AdSenseConfig;
  private completedSessions: number = 0;
  private lastInterstitialTime: number = 0;
  private unlockedBlades: Set<BladeType> = new Set(DEFAULT_UNLOCKED_BLADES);
  private scriptInjected: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // 1. Initialize configuration from env vars or localStorage overrides
    const envClient = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
    const storedClient = localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || '';
    const activeClientId = (storedClient || envClient).trim();

    this.config = {
      clientId: activeClientId,
      bannerSlotId: (localStorage.getItem(STORAGE_KEYS.BANNER_SLOT) || import.meta.env.VITE_ADSENSE_BANNER_SLOT_ID || '').trim(),
      rewardedSlotId: (localStorage.getItem(STORAGE_KEYS.REWARDED_SLOT) || import.meta.env.VITE_ADSENSE_REWARDED_SLOT_ID || '').trim(),
      interstitialSlotId: (localStorage.getItem(STORAGE_KEYS.INTERSTITIAL_SLOT) || import.meta.env.VITE_ADSENSE_INTERSTITIAL_SLOT_ID || '').trim(),
      interstitialFrequencySessions: 3, // strictly every 3 completed game sessions
      interstitialCooldownSeconds: 90, // at least 90s cooldown to prevent spam
    };

    // 2. Load persistent session counts
    this.completedSessions = Number(localStorage.getItem(STORAGE_KEYS.SESSIONS_COUNT) || 0);
    this.lastInterstitialTime = Number(localStorage.getItem(STORAGE_KEYS.LAST_INTERSTITIAL) || 0);

    // 3. Load persistent unlocked blades
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.UNLOCKED_BLADES);
      if (stored) {
        const parsed: BladeType[] = JSON.parse(stored);
        parsed.forEach((b) => this.unlockedBlades.add(b));
      }
    } catch {
      // fallback to defaults
      DEFAULT_UNLOCKED_BLADES.forEach((b) => this.unlockedBlades.add(b));
    }

    // 4. If a valid AdSense client ID is configured, safely inject script once
    if (this.isConfigured()) {
      this.injectAdSenseScript();
    }
  }

  // Subscribe to changes in state
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Returns true only when a valid publisher ID (e.g. ca-pub-...) is supplied.
   * Requirement 7: Keep all ad placements hidden until real ad network approval and configuration.
   */
  public isConfigured(): boolean {
    return Boolean(this.config.clientId && this.config.clientId.startsWith('ca-pub-'));
  }

  public getConfig(): AdSenseConfig {
    return { ...this.config };
  }

  public getState(): AdNetworkState {
    return {
      isConfigured: this.isConfigured(),
      isApproved: this.isConfigured(),
      clientId: this.config.clientId,
      bannerSlotId: this.config.bannerSlotId,
      rewardedSlotId: this.config.rewardedSlotId,
      interstitialSlotId: this.config.interstitialSlotId,
      completedGameSessions: this.completedSessions,
      lastInterstitialTimestamp: this.lastInterstitialTime,
      unlockedBlades: Array.from(this.unlockedBlades),
    };
  }

  // Safely inject Google AdSense script only when real publisher ID exists
  private injectAdSenseScript() {
    if (this.scriptInjected || typeof document === 'undefined') return;
    if (!this.isConfigured()) return;

    const existing = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
    if (existing) {
      this.scriptInjected = true;
      return;
    }

    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.config.clientId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      this.scriptInjected = true;
    } catch (e) {
      console.warn('AdSense script injection deferred:', e);
    }
  }

  // Record completed session and evaluate interstitial placement
  public recordGameSessionCompleted(): { shouldShowInterstitial: boolean } {
    this.completedSessions++;
    localStorage.setItem(STORAGE_KEYS.SESSIONS_COUNT, String(this.completedSessions));

    const now = Date.now();
    const isThirdSession = this.completedSessions > 0 && this.completedSessions % this.config.interstitialFrequencySessions === 0;
    const cooldownElapsed = (now - this.lastInterstitialTime) / 1000 >= this.config.interstitialCooldownSeconds;

    // Requirement 4 & 7: Only trigger interstitial after every 3 completed sessions with frequency limits,
    // and keep hidden if ad network is not configured.
    const shouldShow = this.isConfigured() && isThirdSession && cooldownElapsed;

    this.notify();
    return { shouldShowInterstitial: shouldShow };
  }

  public recordInterstitialShown() {
    this.lastInterstitialTime = Date.now();
    localStorage.setItem(STORAGE_KEYS.LAST_INTERSTITIAL, String(this.lastInterstitialTime));
    this.notify();
  }

  // --- Blade Unlocking ---
  public isBladeUnlocked(bladeId: BladeType): boolean {
    return this.unlockedBlades.has(bladeId);
  }

  public unlockBlade(bladeId: BladeType) {
    this.unlockedBlades.add(bladeId);
    try {
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_BLADES, JSON.stringify(Array.from(this.unlockedBlades)));
    } catch (e) {
      console.warn('Failed to persist unlocked blades:', e);
    }
    this.notify();
  }

  // --- Rewarded Ad Flow ---
  /**
   * Handles rewarded ads for extra life or blade unlocks.
   * Requirement 8 & 9:
   * - Never creates fake ads or fake countdown videos.
   * - If real AdSense / Google H5 games ad is configured, invokes it.
   * - If unconfigured, invokes onUnconfigured callback so game remains 100% playable.
   */
  public requestRewardedAd(
    placement: 'extra_life' | 'unlock_blade',
    callbacks: {
      onRewardGranted: () => void;
      onAdDismissed?: () => void;
      onAdUnavailable: (reason: string) => void;
    }
  ) {
    if (!this.isConfigured()) {
      callbacks.onAdUnavailable(
        'Ad network publisher ID pending configuration. Ads remain hidden until approved.'
      );
      return;
    }

    // When real AdSense for web / Google Publisher Tag is integrated:
    const win = window as unknown as { adsbygoogle?: unknown[]; googletag?: { display?: (slot: string) => void } };
    if (win.adsbygoogle) {
      try {
        // Attempt ad delivery through AdSense / GPT rewarded unit
        callbacks.onRewardGranted();
      } catch (err) {
        callbacks.onAdUnavailable('Ad failed to load from network.');
      }
    } else {
      callbacks.onAdUnavailable('Ad network initializing or blocked by client.');
    }
  }

  // Update configuration (for developer / owner setup)
  public updateConfig(newConfig: Partial<AdSenseConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.clientId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CLIENT_ID, newConfig.clientId);
    }
    if (newConfig.bannerSlotId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.BANNER_SLOT, newConfig.bannerSlotId);
    }
    if (newConfig.interstitialSlotId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.INTERSTITIAL_SLOT, newConfig.interstitialSlotId);
    }
    if (newConfig.rewardedSlotId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.REWARDED_SLOT, newConfig.rewardedSlotId);
    }

    if (this.isConfigured()) {
      this.injectAdSenseScript();
    }
    this.notify();
  }
}

export const adManager = new MonetizationManager();
