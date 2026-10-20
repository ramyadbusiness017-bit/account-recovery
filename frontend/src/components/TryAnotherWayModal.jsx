import React from 'react';
import { X, Smartphone, KeyRound, Mail, HelpCircle, ChevronRight } from 'lucide-react';

export default function TryAnotherWayModal({
  isOpen,
  onClose,
  onSelectMethod,
  currentMethod
}) {
  if (!isOpen) return null;

  const recoveryMethods = [
    {
      id: 'NUMBER_MATCH',
      title: 'Tap matching number in email',
      description: 'Check the security notification sent to your email and select the matching number.',
      icon: Smartphone,
      badge: 'Recommended'
    },
    {
      id: 'LAST_PASSWORD',
      title: 'Enter last remembered password',
      description: 'Enter the last password you remember using with this account.',
      icon: KeyRound,
      badge: null
    },
    {
      id: 'OTP_CODE',
      title: 'Get a 6-digit verification code',
      description: 'Get a verification code sent to your email address.',
      icon: Mail,
      badge: null
    },
    {
      id: 'SUPPORT',
      title: 'Contact administrator / Help',
      description: 'Ask your enterprise security administrator for account assistance.',
      icon: HelpCircle,
      badge: null
    }
  ];

  const handleSelect = (methodId) => {
    onSelectMethod(methodId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white border border-[#dadce0] rounded-[24px] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f3f4]">
          <h2 className="text-[18px] font-normal text-[#1f1f1f]">Choose how you want to sign in</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {recoveryMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = currentMethod === method.id;

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => handleSelect(method.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-[#e8f0fe] border-[#0b57d0]'
                    : 'bg-white border-[#dadce0] hover:bg-[#f8f9fa]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#f1f3f4] flex items-center justify-center text-[#0b57d0] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-medium text-[#1f1f1f]">
                      {method.title}
                    </span>
                    {method.badge && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35]">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#5f6368] leading-relaxed">
                    {method.description}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-[#747775] mt-2 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#f1f3f4] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-[14px] font-medium text-[#0b57d0] hover:bg-[#e8f0fe] px-4 py-2 rounded-full transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
