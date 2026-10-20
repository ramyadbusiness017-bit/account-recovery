import React, { useState, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import AccountBadge from './AccountBadge';

export default function StepOtpCode({
  sessionData,
  onSubmit,
  loading,
  error,
  onTryAnotherWay,
  onResend,
  onChangeAccount
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...digits];
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) return;
    onSubmit(code);
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <div className="w-full text-left">
      {/* Title */}
      <h1 className="text-[24px] sm:text-[28px] font-normal text-[#1f1f1f] tracking-tight leading-tight">
        Enter the code
      </h1>

      {/* Account Badge */}
      <AccountBadge
        email={sessionData?.email}
        fullName={sessionData?.full_name}
        avatarUrl={sessionData?.avatar_url}
        onChangeAccount={onChangeAccount}
      />

      <p className="text-[14px] sm:text-[15px] text-[#444746] mt-4 mb-6 leading-normal font-normal">
        A verification code was just sent to <span className="font-medium text-[#1f1f1f]">{sessionData?.masked_email || 'your email'}</span>
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-md bg-[#fdeded] border border-[#f5c2c7] text-[#b02a37] text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 6 Digit Inputs */}
        <div className="flex justify-between gap-2 max-w-sm mx-auto my-6">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              autoFocus={idx === 0}
              className="w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-mono font-bold bg-white border border-[#747775] focus:border-[#0b57d0] focus:border-2 rounded-[4px] text-[#1f1f1f] outline-none transition-colors"
            />
          ))}
        </div>

        {/* Resend Link */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onResend}
            className="text-[14px] font-medium text-[#0b57d0] hover:underline inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Didn't get a code? Send again</span>
          </button>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-8 border-t border-[#f1f3f4]">
          <button
            type="button"
            onClick={onTryAnotherWay}
            className="text-[14px] font-medium text-[#0b57d0] hover:bg-[#f0f4f9] px-3 py-2 rounded-full transition-colors -ml-3"
          >
            Try another way
          </button>

          <button
            type="submit"
            disabled={loading || !isComplete}
            className="inline-flex items-center justify-center gap-2 min-w-[88px] px-6 h-[40px] rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <span>Next</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
