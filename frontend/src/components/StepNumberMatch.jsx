import React, { useEffect, useState } from 'react';
import { Mail, RefreshCw, Smartphone, ExternalLink, CheckCircle2, Shield } from 'lucide-react';
import AccountBadge from './AccountBadge';

export default function StepNumberMatch({
  sessionData,
  onVerified,
  onTryAnotherWay,
  onResend,
  onOpenMailbox,
  onChangeAccount
}) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const matchNumber = sessionData?.match_number || 58;
  const maskedEmail = sessionData?.masked_email || sessionData?.email || 'your email';

  // Resend countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Real-time status polling for the matching tap
  useEffect(() => {
    if (!sessionData?.session_id || verifiedSuccess) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/recovery/status/${sessionData.session_id}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.is_verified && isSubscribed) {
          setVerifiedSuccess(true);
          clearInterval(interval);
          setTimeout(() => {
            onVerified();
          }, 800);
        }
      } catch (err) {}
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [sessionData?.session_id, verifiedSuccess, onVerified]);

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setTimeLeft(60);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full text-left">
      {/* Title */}
      <h1 className="text-[24px] sm:text-[28px] font-normal text-[#1f1f1f] tracking-tight leading-tight">
        Check your email
      </h1>

      {/* Account Badge */}
      <AccountBadge
        email={sessionData?.email}
        fullName={sessionData?.full_name}
        avatarUrl={sessionData?.avatar_url}
        onChangeAccount={onChangeAccount}
      />

      <p className="text-[14px] sm:text-[15px] text-[#444746] mt-4 mb-6 leading-normal font-normal">
        To help verify it's you, Gonnit sent a notification to <strong className="text-[#1f1f1f] font-medium">{maskedEmail}</strong>.
      </p>

      {/* Verification Success Animation */}
      {verifiedSuccess ? (
        <div className="my-6 p-6 rounded-2xl bg-[#edf7ed] border border-[#c3e6cb] text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#34a853]/10 text-[#34a853] flex items-center justify-center mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-[16px] font-medium text-[#1e4620]">Number confirmed!</h3>
          <p className="text-[13px] text-[#34a853]">Redirecting to password reset...</p>
        </div>
      ) : (
        /* The Google-Style Number Prompt on White */
        <div className="my-6 p-6 rounded-2xl bg-[#f8f9fa] border border-[#dadce0] text-center">
          <p className="text-[14px] text-[#444746] mb-3">
            Open the notification and tap the number:
          </p>

          {/* Large Match Number Box */}
          <div className="inline-block my-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-[#0b57d0] flex items-center justify-center shadow-sm google-radar-box">
              <span className="text-[40px] sm:text-[48px] font-sans font-bold text-[#0b57d0]">
                {matchNumber}
              </span>
            </div>
          </div>

          <p className="text-[13px] font-medium text-[#1f1f1f] mt-3">
            Select <strong className="text-[#0b57d0] font-bold text-base">{matchNumber}</strong> in the email to confirm it's you.
          </p>

          {/* Polling Radar indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#5f6368]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0b57d0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0b57d0]"></span>
            </span>
            <span>Waiting for your tap...</span>
          </div>

          {/* Quick-test button */}
          <div className="mt-4 pt-4 border-t border-[#e8eaed]">
            <button
              type="button"
              onClick={onOpenMailbox}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#e8f0fe] border border-[#dadce0] text-[#0b57d0] text-xs font-medium transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Preview Security Email (Tap here to test)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Actions Row */}
      <div className="flex items-center justify-between pt-6 border-t border-[#f1f3f4]">
        <button
          type="button"
          onClick={onTryAnotherWay}
          className="text-[14px] font-medium text-[#0b57d0] hover:bg-[#f0f4f9] px-3 py-2 rounded-full transition-colors -ml-3"
        >
          Try another way
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={timeLeft > 0 || isResending}
          className="text-[14px] font-medium text-[#0b57d0] hover:bg-[#f0f4f9] px-3 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {timeLeft > 0 ? (
            <span>Resend it ({timeLeft}s)</span>
          ) : (
            <span>Resend it</span>
          )}
        </button>
      </div>
    </div>
  );
}
