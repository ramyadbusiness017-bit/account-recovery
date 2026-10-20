import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function StepSuccess({ userEmail, onRestart }) {
  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="w-full text-center py-4">
      <div className="w-16 h-16 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <h1 className="text-[24px] sm:text-[28px] font-normal text-[#1f1f1f] tracking-tight mb-2">
        Password changed
      </h1>

      <p className="text-[14px] text-[#444746] max-w-sm mx-auto mb-8">
        Your Gonnit account (<strong className="text-[#1f1f1f]">{userEmail}</strong>) has been successfully secured.
      </p>

      {/* Security Actions Card */}
      <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0] text-left space-y-2 mb-8 text-[13px] text-[#3c4043]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#137333] shrink-0" />
          <span>Active sessions on other devices were signed out.</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1a73e8] shrink-0" />
          <span>Password security audit event logged.</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onRestart}
          className="w-full h-[40px] rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-[14px] transition-colors"
        >
          Continue
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="text-[14px] font-medium text-[#0b57d0] hover:underline"
        >
          Sign in with another account
        </button>
      </div>
    </div>
  );
}
