import React, { useState } from 'react';
import { adManager } from '../monetization/adManager';
import { X, DollarSign, CheckCircle2, AlertCircle, Save, ExternalLink } from 'lucide-react';

interface MonetizationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonetizationSettingsModal: React.FC<MonetizationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentConfig = adManager.getConfig();
  const [clientId, setClientId] = useState(currentConfig.clientId);
  const [bannerSlotId, setBannerSlotId] = useState(currentConfig.bannerSlotId);
  const [interstitialSlotId, setInterstitialSlotId] = useState(currentConfig.interstitialSlotId);
  const [rewardedSlotId, setRewardedSlotId] = useState(currentConfig.rewardedSlotId);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const isConfigured = clientId.trim().startsWith('ca-pub-');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    adManager.updateConfig({
      clientId: clientId.trim(),
      bannerSlotId: bannerSlotId.trim(),
      interstitialSlotId: interstitialSlotId.trim(),
      rewardedSlotId: rewardedSlotId.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#140b07] border border-amber-900/60 rounded-3xl p-6 md:p-8 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-950/60 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">AdSense Monetization</h3>
              <p className="text-xs text-amber-200/60">Google AdSense for Web & Games Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout */}
        <div
          className={`p-3.5 rounded-xl border mb-5 flex items-start gap-3 ${
            isConfigured
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
          }`}
        >
          {isConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs leading-relaxed">
            <strong className="block font-semibold mb-0.5">
              {isConfigured
                ? 'Ad Network Configured & Active'
                : 'Ads Hidden Until Configuration & Approval'}
            </strong>
            {isConfigured
              ? 'All ad containers will render live units using your approved publisher ID.'
              : 'All banner and interstitial placements remain 100% hidden to keep the game pristine until your real publisher ID is supplied.'}
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Publisher Client ID (AdSense)
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="ca-pub-1234567890123456"
              className="w-full px-3.5 py-2.5 bg-black/60 border border-amber-950/80 rounded-xl text-white text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/80"
            />
            <span className="text-[11px] text-neutral-500 mt-1 block">
              Starts with <code className="text-amber-300">ca-pub-</code> from your Google AdSense console.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Banner Slot ID
              </label>
              <input
                type="text"
                value={bannerSlotId}
                onChange={(e) => setBannerSlotId(e.target.value)}
                placeholder="1234567890"
                className="w-full px-3 py-2 bg-black/60 border border-amber-950/80 rounded-xl text-white text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/80"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Interstitial Slot ID
              </label>
              <input
                type="text"
                value={interstitialSlotId}
                onChange={(e) => setInterstitialSlotId(e.target.value)}
                placeholder="2345678901"
                className="w-full px-3 py-2 bg-black/60 border border-amber-950/80 rounded-xl text-white text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/80"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Rewarded Slot ID
              </label>
              <input
                type="text"
                value={rewardedSlotId}
                onChange={(e) => setRewardedSlotId(e.target.value)}
                placeholder="3456789012"
                className="w-full px-3 py-2 bg-black/60 border border-amber-950/80 rounded-xl text-white text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">
              {savedNotice ? '✓ Settings saved successfully' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Ad Settings</span>
              </button>
            </div>
          </div>
        </form>

        {/* Integration Notes */}
        <div className="mt-5 pt-4 border-t border-amber-950/50 text-[11px] text-neutral-400 space-y-1.5">
          <div className="font-semibold text-amber-300 flex items-center gap-1">
            <span>Official Google AdSense for Games Notice</span>
            <ExternalLink className="w-3 h-3" />
          </div>
          <p>
            To serve live production ads, submit your domain to Google AdSense. Once approved, paste your client ID above or add it to <code className="text-amber-200">.env</code> as <code className="text-amber-200">VITE_ADSENSE_CLIENT_ID</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
