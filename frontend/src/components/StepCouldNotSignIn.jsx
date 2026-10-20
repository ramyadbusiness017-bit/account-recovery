import React from 'react';
import { ArrowLeft } from 'lucide-react';
import GonnitLogo from './GonnitLogo';
import AccountBadge from './AccountBadge';

export default function StepCouldNotSignIn({
  sessionData,
  onBack,
  onTryAgain,
  onChangeAccount
}) {
  const userEmail = sessionData?.email || 'robertmoorebusiness1@gmail.com';

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

      {/* 2-Column Responsive Layout Matching Image 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* LEFT COLUMN */}
        <div>
          <div className="mb-4">
            <GonnitLogo />
          </div>

          <h1 className="text-[28px] sm:text-[32px] font-normal text-[#1f1f1f] tracking-tight leading-tight mb-4">
            Couldn’t sign you in
          </h1>

          <AccountBadge
            email={userEmail}
            fullName={sessionData?.full_name}
            avatarUrl={sessionData?.avatar_url}
            onChangeAccount={onChangeAccount}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col justify-between h-full pt-2">
          <div>
            <p className="text-[14px] text-[#444746] leading-relaxed mb-4">
              You didn't provide enough info for Google to be sure this account is really yours. Google asks for this info to keep your account secure.
            </p>

            <p className="text-[14px] text-[#444746] mb-2">
              If possible, when signing in:
            </p>

            <ul className="text-[14px] text-[#444746] space-y-2 mb-4 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-[#1f1f1f] leading-tight">•</span>
                <span>Answer as many questions as you can</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#1f1f1f] leading-tight">•</span>
                <span>Use a device where you’ve signed in before</span>
              </li>
            </ul>

            <p className="text-[14px] text-[#444746] leading-relaxed mb-4">
              If your account is managed with Family Link, we’ve sent an email to your parent to change your password.
            </p>

            <div className="mb-8">
              <a
                href="#tips"
                className="text-[14px] font-medium text-[#0b57d0] hover:underline"
              >
                More tips to recover your account
              </a>
            </div>
          </div>

          {/* Bottom Right: Try again */}
          <div className="pt-6 md:pt-14 flex justify-end">
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex items-center justify-center min-w-[96px] px-6 h-[40px] rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-[14px] transition-colors shadow-none"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
