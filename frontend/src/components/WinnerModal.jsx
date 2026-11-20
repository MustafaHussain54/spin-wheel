import React from 'react';
import { Gift, Percent, Frown, Sparkles, RefreshCw, X } from 'lucide-react';

export default function WinnerModal({ isOpen, result, onClose, onResetKiosk }) {
  if (!isOpen || !result) return null;

  const isNoPrize = result.category === 'No Prize';
  const isDiscount = result.category === 'Discount';
  const isGift = result.category === 'Gift';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fade-in text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Company Header Branding */}
        <div className="mb-4 inline-flex items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-200/80">
          <img
            src="/jaliwala-logo.png"
            alt="Jaliwala Innovations"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Icon Header */}
        <div className="mx-auto mb-3.5 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs"
             style={{
               background: isNoPrize
                 ? '#f1f5f9'
                 : isGift
                 ? '#fef3c7'
                 : '#fee2e2'
             }}>
          {isNoPrize && <Frown className="w-8 h-8 text-slate-500" />}
          {isGift && <Gift className="w-8 h-8 text-amber-700 animate-bounce" />}
          {isDiscount && <Percent className="w-8 h-8 text-rose-700" />}
        </div>

        {/* Status Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2"
             style={{
               backgroundColor: isNoPrize ? '#f1f5f9' : isGift ? '#fef3c7' : '#fee2e2',
               color: isNoPrize ? '#64748b' : isGift ? '#b45309' : '#b91c1c'
             }}>
          {isNoPrize ? (
            'Appreciation'
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Congratulations Winner!</span>
            </>
          )}
        </div>

        {/* Prize Name */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 mb-2">
          {result.prizeName}
        </h2>

        {/* Details & Redemption Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-3 text-left">
          <p className="text-xs uppercase tracking-wider text-[#476379] font-bold mb-1">
            Redemption & Claim Details
          </p>
          <p className="text-xs text-slate-600">
            {result.claimInstructions || 'Please present your ticket ID at the Jaliwala Innovations booth counter to claim.'}
          </p>

          {isDiscount && result.discountPercentage > 0 && (
            <div className="mt-2.5 inline-block px-2.5 py-0.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-bold text-xs">
              Discount: {result.discountPercentage}% OFF
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
          <button
            onClick={onResetKiosk}
            className="flex-1 py-2.5 px-4 bg-[#476379] hover:bg-[#384f61] text-white font-semibold rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white" />
            <span>Next Visitor</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-xs active:scale-95 transition-all text-xs cursor-pointer"
          >
            View Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
