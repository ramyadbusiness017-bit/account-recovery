import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function AccountBadge({ email, fullName, avatarUrl, onChangeAccount }) {
  if (!email) return null;

  return (
    <div
      onClick={onChangeAccount}
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#dadce0] hover:bg-[#f8f9fa] transition-colors cursor-pointer my-3 text-left max-w-full select-none"
      title="Switch account"
    >
      {/* Circular Avatar */}
      <div className="w-5 h-5 rounded-full overflow-hidden bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center shrink-0 text-xs font-semibold">
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName || email} className="w-full h-full object-cover" />
        ) : (
          <span className="uppercase">{email.charAt(0)}</span>
        )}
      </div>

      {/* Email Address */}
      <span className="text-sm font-medium text-[#3c4043] tracking-tight truncate max-w-[220px] sm:max-w-[280px]">
        {email}
      </span>

      {/* Down Chevron */}
      <ChevronDown className="w-4 h-4 text-[#5f6368] shrink-0" />
    </div>
  );
}
