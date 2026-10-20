import React from 'react';
import GonnitLogo from './GonnitLogo';
import { ChevronDown, Shield } from 'lucide-react';

export default function Layout({
  children,
  isWide = false,
  onOpenAdmin
}) {
  return (
    <div className="min-h-screen bg-white text-[#1f1f1f] flex flex-col justify-between selection:bg-[#c2e7ff] selection:text-[#001d35]">
      {/* Top Header on Mobile */}
      <header className="w-full max-w-[450px] mx-auto px-6 pt-6 pb-2 flex items-center justify-between sm:hidden">
        <GonnitLogo />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-10">
        <div
          className={`w-full ${
            isWide ? 'max-w-[760px] sm:p-10 sm:min-h-[500px]' : 'max-w-[448px] sm:p-10 sm:min-h-[480px]'
          } bg-white sm:border sm:border-[#dadce0] sm:rounded-[28px] text-left transition-all duration-300`}
        >
          {/* Logo inside card for single-column views */}
          {!isWide && (
            <div className="hidden sm:block mb-4">
              <GonnitLogo />
            </div>
          )}

          {/* Children steps */}
          {children}
        </div>
      </main>

      {/* Google Footer */}
      <footer
        className={`w-full ${
          isWide ? 'max-w-[760px]' : 'max-w-[448px]'
        } mx-auto px-6 py-6 text-[12px] text-[#444746] flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300`}
      >
        {/* Language Picker */}
        <div className="flex items-center gap-1.5 hover:text-[#1f1f1f] cursor-pointer transition-colors select-none">
          <span>English (United States)</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#5f6368]" />
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-[12px]">
          <a href="#admin" onClick={onOpenAdmin} className="hover:text-[#0b57d0] transition-colors font-medium">
            Admin Panel
          </a>
          <a href="#help" className="hover:text-[#1f1f1f] transition-colors">Help</a>
          <a href="#privacy" className="hover:text-[#1f1f1f] transition-colors">Privacy</a>
          <a href="#terms" className="hover:text-[#1f1f1f] transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
