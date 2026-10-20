import React, { useState, useEffect } from 'react';
import { Mail, X, RefreshCw, Smartphone, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function LiveMailboxDrawer({
  isOpen,
  onClose,
  targetEmail,
  onNumberTapped
}) {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await api.getRecentEmails(10, targetEmail);
      setEmails(data);
      if (data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      } else if (data.length > 0 && selectedEmail) {
        const updated = data.find((e) => e.id === selectedEmail.id) || data[0];
        setSelectedEmail(updated);
      }
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
      const interval = setInterval(fetchEmails, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, targetEmail]);

  const handleTapNumber = async (chosenNumber) => {
    if (!selectedEmail) return;
    setActionMessage({ type: 'loading', text: `Tapping ${chosenNumber}...` });
    try {
      await api.verifyViaEmailLink(selectedEmail.approval_token, chosenNumber);
      setActionMessage({
        type: 'success',
        text: `Match verified with ${chosenNumber}! The recovery page will advance now.`
      });
      if (onNumberTapped) {
        onNumberTapped(chosenNumber);
      }
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Incorrect number tapped'
      });
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white border-l border-[#dadce0] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#f1f3f4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] flex items-center justify-center text-[#0b57d0]">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1f1f1f] flex items-center gap-2">
                Gonnit Security Mailbox
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333]">
                  Live Dispatch
                </span>
              </h2>
              <p className="text-[11px] text-[#5f6368]">
                Real-time security emails sent to user
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchEmails}
              disabled={loading}
              title="Refresh inbox"
              className="p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action message banner */}
        {actionMessage && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-[#e6f4ea] text-[#137333] border-b border-[#ceead6]'
                : actionMessage.type === 'error'
                ? 'bg-[#fdeded] text-[#b02a37] border-b border-[#f5c2c7]'
                : 'bg-[#e8f0fe] text-[#0b57d0] border-b border-[#d2e3fc]'
            }`}
          >
            {actionMessage.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Content */}
        {emails.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#5f6368]">
            <Mail className="w-12 h-12 text-[#dadce0] mb-3" />
            <h3 className="text-sm font-semibold text-[#1f1f1f] mb-1">No emails dispatched yet</h3>
            <p className="text-xs max-w-xs">
              Enter your account on the recovery screen to dispatch a security verification email.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Email Tabs */}
            {emails.length > 1 && (
              <div className="flex gap-2 p-2 px-4 border-b border-[#f1f3f4] bg-[#f8f9fa] overflow-x-auto text-xs">
                {emails.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedEmail(e)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      selectedEmail?.id === e.id
                        ? 'bg-[#e8f0fe] text-[#0b57d0] font-medium'
                        : 'text-[#5f6368] hover:text-[#1f1f1f] hover:bg-[#f1f3f4]'
                    }`}
                  >
                    <span>#{e.id}</span>
                    <span>({new Date(e.sent_at).toLocaleTimeString()})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Email Meta bar */}
            {selectedEmail && (
              <div className="p-4 border-b border-[#f1f3f4] bg-[#f8f9fa] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1f1f1f]">{selectedEmail.subject}</span>
                  <span className="text-[11px] text-[#5f6368] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedEmail.sent_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[#5f6368]">
                  To: <span className="text-[#1f1f1f] font-mono">{selectedEmail.to_email}</span>
                </div>
              </div>
            )}

            {/* Interactive Tap Simulator */}
            {selectedEmail && selectedEmail.match_options && selectedEmail.match_options.length > 0 && (
              <div className="p-4 bg-[#f0f4f9] border-b border-[#dadce0]">
                <p className="text-xs font-semibold text-[#0b57d0] mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Interactive Tap Challenge &mdash; Select the number to verify:
                </p>
                <div className="flex items-center gap-3">
                  {selectedEmail.match_options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleTapNumber(opt)}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#0b57d0] hover:text-white border border-[#dadce0] text-[#1f1f1f] font-sans font-bold text-xl shadow-xs transition-all active:scale-95"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#5f6368] mt-2">
                  Matching number shown on screen is: <strong className="text-[#0b57d0]">{selectedEmail.match_number}</strong>
                </p>
              </div>
            )}

            {/* Email HTML Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f1f3f4]">
              {selectedEmail && (
                <div
                  className="rounded-xl overflow-hidden border border-[#dadce0] shadow-sm bg-white"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
