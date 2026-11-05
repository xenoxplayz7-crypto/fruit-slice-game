import React, { useEffect, useRef, useState } from 'react';
import { adManager } from '../monetization/adManager';
import { X, ArrowRight } from 'lucide-react';

interface InterstitialAdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({ isOpen, onClose }) => {
  const adRef = useRef<HTMLModElement>(null);
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const state = adManager.getState();

  useEffect(() => {
    if (!isOpen) {
      setCanClose(false);
      setCountdown(3);
      return;
    }

    // Record interstitial shown for frequency capping limit (min 90s)
    adManager.recordInterstitialShown();

    // 3-second gentle timer before enabling primary continue button
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Push ad request if AdSense is available
    if (state.isConfigured && adRef.current) {
      try {
        const win = window as unknown as { adsbygoogle?: unknown[] };
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({});
      } catch (e) {
        console.warn('AdSense interstitial execution deferred:', e);
      }
    }

    return () => clearInterval(timer);
  }, [isOpen, state.isConfigured]);

  // Requirement 7: Keep all ad placements hidden until real ad network approval and configuration
  if (!isOpen || !state.isConfigured) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none">
      <div className="relative w-full max-w-lg bg-[#140b07] border border-amber-900/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
        {/* Header with Close action */}
        <div className="w-full flex items-center justify-between border-b border-amber-950/60 pb-3 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
            Dojo Intermission · विज्ञापन
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close Ad"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real AdSense Interstitial Unit */}
        <div className="w-full min-h-[250px] bg-black/40 rounded-xl overflow-hidden flex items-center justify-center border border-amber-950/40 my-2">
          <ins
            ref={adRef}
            className="adsbygoogle block w-full text-center"
            style={{ display: 'block', minHeight: '250px' }}
            data-ad-client={state.clientId}
            data-ad-slot={state.interstitialSlotId || undefined}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* Bottom Continue Action */}
        <div className="w-full mt-4 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            {countdown > 0 ? `Skip in ${countdown}s...` : 'Ready to continue'}
          </span>
          <button
            onClick={onClose}
            disabled={!canClose}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              canClose
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 active:scale-95 shadow-lg'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <span>Continue to Dojo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
