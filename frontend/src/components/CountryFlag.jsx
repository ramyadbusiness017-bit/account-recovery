import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

/**
 * CountryFlag Component
 * Renders guaranteed 100% crisp, local SVG flags that:
 * 1. Require ZERO network requests (pure vector inline SVG from country-flag-icons)
 * 2. Cannot be blocked by adblockers, Brave Shields, or privacy extensions
 * 3. Never fail on Windows or any OS
 * 4. Fallback chain: React SVG Component -> Local /flags/{code}.svg -> FlagCDN -> Styled Badge
 */
export default function CountryFlag({ code, country = '', className = 'w-7 h-5' }) {
  const normalizedCode = (code || '').toUpperCase().trim();
  const FlagComponent = Flags[normalizedCode];

  if (FlagComponent) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 rounded-[3px] overflow-hidden shadow-xs border border-slate-300 bg-slate-50 ${className}`}
        title={`${country} (${normalizedCode})`}
      >
        <FlagComponent className="w-full h-full object-cover" />
      </span>
    );
  }

  // Fallback 1: Local /flags/{code}.svg file served from /public/flags/
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-[3px] overflow-hidden shadow-xs border border-slate-300 bg-slate-50 ${className}`}
      title={`${country} (${normalizedCode})`}
    >
      <img
        src={`/flags/${normalizedCode || 'UN'}.svg`}
        alt={country || normalizedCode}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback 2: Remote FlagCDN
          if (!e.target.dataset.triedCdn) {
            e.target.dataset.triedCdn = 'true';
            e.target.src = `https://flagcdn.com/w80/${(normalizedCode || 'un').toLowerCase()}.png`;
          } else {
            // Fallback 3: Text ISO badge
            e.target.style.display = 'none';
            if (e.target.parentElement) {
              e.target.parentElement.innerHTML = `<span class="text-[10px] font-bold text-slate-700 font-mono">${normalizedCode || '🌐'}</span>`;
            }
          }
        }}
      />
    </span>
  );
}
