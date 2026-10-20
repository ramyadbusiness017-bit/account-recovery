import React, { useState, useEffect } from 'react';
import { Shield, Users, RefreshCw, X, Globe, Smartphone, Laptop, Tablet, MapPin, PlusCircle, Activity } from 'lucide-react';
import { api } from '../services/api';
import CountryFlag from './CountryFlag';

export default function AdminDashboard({ isOpen, onClose }) {
  const [tab, setTab] = useState('visitors'); // visitors, overview, users, sessions, audit
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [seedSuccess, setSeedSuccess] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, usersData, sessData, visitorsData, logsData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminSessions(),
        api.getAdminVisitors(),
        api.getAdminAuditLogs()
      ]);
      setOverview(ovData);
      setUsers(usersData);
      setSessions(sessData);
      setVisitors(visitorsData);
      setAuditLogs(logsData);
    } catch (err) {
      setError(err.message || 'Failed to load telemetry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail || !newUsername) return;
    try {
      const res = await api.seedUser(newEmail, newUsername, newFullName || newUsername, 'GonnitSecure2026!');
      setSeedSuccess(res.message);
      setNewEmail('');
      setNewUsername('');
      setNewFullName('');
      loadData();
      setTimeout(() => setSeedSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getDeviceIcon = (devType) => {
    if (devType === 'Mobile') return <Smartphone className="w-4 h-4 text-[#0b57d0]" />;
    if (devType === 'Tablet') return <Tablet className="w-4 h-4 text-[#137333]" />;
    return <Laptop className="w-4 h-4 text-[#5f6368]" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-white border border-[#dadce0] rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 sm:py-5 border-b border-[#f1f3f4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] flex items-center justify-center text-[#0b57d0]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-[#1f1f1f] flex items-center gap-2">
                Gonnit Security & Visitor Intelligence
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#c2e7ff] text-[#001d35]">
                  Live Telemetry
                </span>
              </h2>
              <p className="text-[12px] text-[#5f6368]">
                Real-time device detection, country geolocation, and recovery audit trails
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="Refresh"
              className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#f1f3f4] bg-[#f8f9fa] px-6 gap-6 text-[13px] font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('visitors')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'visitors'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Visitor Telemetry ({visitors.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              tab === 'overview'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            Analytics Overview
          </button>
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              tab === 'users'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            Users Directory ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('sessions')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              tab === 'sessions'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            Recovery Sessions ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('audit')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              tab === 'audit'
                ? 'border-[#0b57d0] text-[#0b57d0]'
                : 'border-transparent text-[#5f6368] hover:text-[#1f1f1f]'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#fdeded] border border-[#f5c2c7] text-[#b02a37] text-xs">
              {error}
            </div>
          )}

          {/* TAB: VISITOR TELEMETRY (COUNTRIES & DEVICES) */}
          {tab === 'visitors' && (
            <div className="space-y-6">
              {/* Country & Device summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-xs text-[#5f6368] block mb-1">Total Tracked Visits</span>
                  <span className="text-2xl font-bold text-[#1f1f1f]">{visitors.length}</span>
                </div>
                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-xs text-[#5f6368] block mb-1">Top Geolocation</span>
                  <span className="text-lg font-bold text-[#0b57d0] flex items-center gap-2">
                    {overview?.top_countries?.[0]?.country_code && (
                      <CountryFlag code={overview.top_countries[0].country_code} country={overview.top_countries[0].country} className="w-6 h-4 shadow-xs" />
                    )}
                    {overview?.top_countries?.[0]?.country || 'Detecting...'}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-xs text-[#5f6368] block mb-1">Device Breakdown</span>
                  <span className="text-sm font-semibold text-[#1f1f1f]">
                    {Object.entries(overview?.device_breakdown || {}).map(([dev, count]) => `${dev}: ${count}`).join(' • ') || 'Desktop'}
                  </span>
                </div>
              </div>

              {/* Live Visitors Table */}
              <div className="border border-[#dadce0] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-[#3c4043]">
                  <thead className="bg-[#f8f9fa] text-[#1f1f1f] border-b border-[#dadce0] font-semibold">
                    <tr>
                      <th className="p-3">Location (Country & City)</th>
                      <th className="p-3">Device Type</th>
                      <th className="p-3">Operating System</th>
                      <th className="p-3">Browser</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f3f4]">
                    {visitors.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-6 text-center text-[#5f6368]">
                          No visitor telemetry recorded yet.
                        </td>
                      </tr>
                    ) : (
                      visitors.map((v) => (
                        <tr key={v.id} className="hover:bg-[#f8f9fa] transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-[#1f1f1f] flex items-center gap-2">
                              <CountryFlag code={v.country_code} country={v.country} className="w-6 h-4 shadow-xs" />
                              <span>{v.country}</span>
                              <span className="text-[11px] font-mono text-[#5f6368]">({v.country_code})</span>
                            </div>
                            <div className="text-[11px] text-[#5f6368] ml-8">{v.city}</div>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f1f3f4] font-medium text-[#1f1f1f]">
                              {getDeviceIcon(v.device_type)}
                              {v.device_type}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-[#1f1f1f]">{v.os}</td>
                          <td className="p-3 text-[#5f6368]">{v.browser}</td>
                          <td className="p-3 font-mono text-[11px] text-[#0b57d0]">{v.ip_address}</td>
                          <td className="p-3 text-[#5f6368] text-[11px]">
                            {new Date(v.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {tab === 'overview' && overview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-xs text-[#5f6368] block mb-1">Total Users</span>
                  <span className="text-2xl font-bold text-[#1f1f1f]">{overview.total_users}</span>
                </div>
                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-xs text-[#5f6368] block mb-1">Pending Recoveries</span>
                  <span className="text-2xl font-bold text-[#b06000]">{overview.pending_sessions}</span>
                </div>
                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-xs text-[#5f6368] block mb-1">Completed Resets</span>
                  <span className="text-2xl font-bold text-[#137333]">{overview.completed_sessions}</span>
                </div>
                <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                  <span className="text-xs text-[#5f6368] block mb-1">Dispatched Emails</span>
                  <span className="text-2xl font-bold text-[#0b57d0]">{overview.total_emails}</span>
                </div>
              </div>

              {/* Seed user form */}
              <div className="p-5 rounded-xl bg-[#f8f9fa] border border-[#dadce0]">
                <h3 className="text-sm font-semibold text-[#1f1f1f] mb-1 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-[#0b57d0]" />
                  Add or Reset a Test User
                </h3>
                <p className="text-xs text-[#5f6368] mb-4">
                  Quickly add new accounts for recovery testing.
                </p>

                {seedSuccess && (
                  <div className="mb-3 p-2.5 rounded-md bg-[#edf7ed] border border-[#c3e6cb] text-[#1e4620] text-xs">
                    {seedSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0]"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className="px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0]"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="px-3 py-2 bg-white border border-[#dadce0] rounded-lg text-xs text-[#1f1f1f] outline-none focus:border-[#0b57d0]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-xs transition-colors"
                  >
                    Save User
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {tab === 'users' && (
            <div className="border border-[#dadce0] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-[#3c4043]">
                <thead className="bg-[#f8f9fa] text-[#1f1f1f] border-b border-[#dadce0] font-semibold">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f8f9fa]">
                      <td className="p-3">
                        <div className="font-semibold text-[#1f1f1f]">{u.full_name || u.email}</div>
                        <div className="text-[11px] text-[#5f6368]">{u.email}</div>
                      </td>
                      <td className="p-3 font-mono text-[#0b57d0]">@{u.username}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.is_admin ? 'bg-[#c2e7ff] text-[#001d35]' : 'bg-[#f1f3f4] text-[#3c4043]'
                        }`}>
                          {u.is_admin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[#137333] font-medium">&bull; Active</span>
                      </td>
                      <td className="p-3 text-[#5f6368]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: SESSIONS */}
          {tab === 'sessions' && (
            <div className="border border-[#dadce0] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-[#3c4043]">
                <thead className="bg-[#f8f9fa] text-[#1f1f1f] border-b border-[#dadce0] font-semibold">
                  <tr>
                    <th className="p-3">Account</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Match Target</th>
                    <th className="p-3">Device & Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#f8f9fa]">
                      <td className="p-3">
                        <div className="font-semibold text-[#1f1f1f]">{s.email}</div>
                      </td>
                      <td className="p-3 font-mono">{s.method}</td>
                      <td className="p-3 font-bold text-[#0b57d0] text-sm">{s.match_number || '-'}</td>
                      <td className="p-3">
                        <div>{s.device_type} ({s.country || 'Unknown'})</div>
                        <div className="text-[10px] text-[#5f6368] font-mono">{s.ip_address}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === 'VERIFIED'
                            ? 'bg-[#c2e7ff] text-[#001d35]'
                            : s.status === 'COMPLETED'
                            ? 'bg-[#e6f4ea] text-[#137333]'
                            : s.status === 'PENDING'
                            ? 'bg-[#feefe3] text-[#b06000]'
                            : 'bg-[#f1f3f4] text-[#5f6368]'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#5f6368]">
                        {new Date(s.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
          {tab === 'audit' && (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-semibold text-[#0b57d0] mr-2">{log.action}</span>
                    <span className="text-[#1f1f1f]">{log.details}</span>
                    {log.country && (
                      <span className="text-[#5f6368] text-[11px] ml-2">
                        &bull; {log.device_type || 'Device'} from {log.country}
                      </span>
                    )}
                  </div>
                  <span className="text-[#5f6368] text-[11px] font-mono shrink-0">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
