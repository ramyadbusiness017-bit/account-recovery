import React, { useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import AccountBadge from './AccountBadge';

export default function StepResetPassword({
  sessionData,
  onSubmit,
  loading,
  error,
  onChangeAccount
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const hasLength = newPassword.length >= 8;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasLength) return;
    if (newPassword !== confirmPassword) return;
    onSubmit(newPassword, confirmPassword);
  };

  return (
    <div className="w-full text-left">
      {/* Title */}
      <h1 className="text-[24px] sm:text-[28px] font-normal text-[#1f1f1f] tracking-tight leading-tight">
        Change password
      </h1>

      {/* Account Badge */}
      <AccountBadge
        email={sessionData?.email}
        fullName={sessionData?.full_name}
        avatarUrl={sessionData?.avatar_url}
        onChangeAccount={onChangeAccount}
      />

      <p className="text-[14px] sm:text-[15px] text-[#444746] mt-3 mb-6 font-normal">
        Choose a strong password and don't reuse it for other accounts.
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-md bg-[#fdeded] border border-[#f5c2c7] text-[#b02a37] text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            autoFocus
            className="w-full h-[56px] px-4 bg-white border border-[#747775] hover:border-[#1f1f1f] focus:border-[#0b57d0] focus:border-2 rounded-[4px] text-[#1f1f1f] placeholder:text-[#444746] text-[16px] outline-none transition-colors"
          />
          <p className="text-[12px] text-[#5f6368] mt-1 ml-1">At least 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className="w-full h-[56px] px-4 bg-white border border-[#747775] hover:border-[#1f1f1f] focus:border-[#0b57d0] focus:border-2 rounded-[4px] text-[#1f1f1f] placeholder:text-[#444746] text-[16px] outline-none transition-colors"
          />
          {confirmPassword && !isMatch && (
            <p className="text-[12px] text-[#b02a37] mt-1 ml-1">Passwords do not match</p>
          )}
        </div>

        {/* Show Password Checkbox */}
        <div className="flex items-center gap-3 select-none pt-1">
          <input
            type="checkbox"
            id="showResetPass"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="w-4 h-4 rounded-[2px] border-[#747775] text-[#0b57d0] focus:ring-0 cursor-pointer accent-[#0b57d0]"
          />
          <label htmlFor="showResetPass" className="text-[14px] text-[#1f1f1f] cursor-pointer">
            Show password
          </label>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-end pt-8">
          <button
            type="submit"
            disabled={loading || !hasLength || !isMatch}
            className="inline-flex items-center justify-center gap-2 min-w-[140px] px-6 h-[40px] rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <span>Change password</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
