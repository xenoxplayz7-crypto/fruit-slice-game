import React, { useEffect, useRef, useState } from 'react';
import { adManager } from '../monetization/adManager';

interface AdSenseBannerProps {
  slotId?: string;
  className?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ slotId, className = '' }) => {
  const adRef = useRef<HTMLModElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState(() => adManager.getState());

  useEffect(() => {
    return adManager.subscribe(() => {
      setState(adManager.getState());
    });
  }, []);

  useEffect(() => {
    // Requirement 7: Keep all ad placements hidden until real ad network approval and configuration
    if (!state.isConfigured || !adRef.current) return;

    try {
      const win = window as unknown as { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
      setIsLoaded(true);
    } catch (e) {
      console.warn('AdSense banner execution deferred:', e);
    }
  }, [state.isConfigured]);

  // Requirement 7: Hidden until real ad network approval & configuration
  if (!state.isConfigured) {
    return null;
  }

  const activeSlot = slotId || state.bannerSlotId;

  return (
    <div
      className={`w-full max-w-4xl mx-auto overflow-hidden flex items-center justify-center transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      aria-label="Advertisement Banner"
    >
      <ins
        ref={adRef}
        className="adsbygoogle block w-full text-center"
        style={{ display: 'block', minHeight: '50px', maxHeight: '90px' }}
        data-ad-client={state.clientId}
        data-ad-slot={activeSlot || undefined}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
};
