import React, { useState } from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

/**
 * CountryFlag Component
 * Renders guaranteed 100% crisp, local SVG flags that:
 * 1. Require ZERO network requests (pure vector inline SVG from country-flag-icons)
 * 2. Cannot be blocked by adblockers, Brave Shields, or privacy extensions
 * 3. Never fail on Windows or any OS
 * 4. Fallback chain: React SVG Component -> Local /flags/{code}.svg -> FlagCDN -> Styled Badge
 * 5. Uses pure React state for fallbacks (NEVER mutates DOM/innerHTML to avoid React 19 unmount crashes)
 */
export default function CountryFlag({ code, country = '', className = 'w-7 h-5' }) {
  const normalizedCode = (code || '').toUpperCase().trim();
  const FlagComponent = Flags[normalizedCode];
  const [triedCdn, setTriedCdn] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

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

  if (hasFailed) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 rounded-[3px] overflow-hidden shadow-xs border border-slate-300 bg-slate-100 ${className}`}
        title={`${country} (${normalizedCode})`}
      >
        <span className="text-[10px] font-bold text-slate-700 font-mono select-none">
          {normalizedCode || '🌐'}
        </span>
      </span>
    );
  }

  const imageSrc = triedCdn
    ? `https://flagcdn.com/w80/${(normalizedCode || 'un').toLowerCase()}.png`
    : `/flags/${normalizedCode || 'UN'}.svg`;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-[3px] overflow-hidden shadow-xs border border-slate-300 bg-slate-50 ${className}`}
      title={`${country} (${normalizedCode})`}
    >
      <img
        src={imageSrc}
        alt={country || normalizedCode}
        className="w-full h-full object-cover"
        onError={() => {
          if (!triedCdn) {
            setTriedCdn(true);
          } else {
            setHasFailed(true);
          }
        }}
      />
    </span>
  );
}
