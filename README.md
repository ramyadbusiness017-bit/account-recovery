# Gonnit &mdash; Company Account Recovery System

A clean, modern, enterprise-grade Account Recovery and Identity Verification system for **Gonnit**, featuring Google-inspired minimalist aesthetics with a distinctive high-tech brand identity and a Python FastAPI backend.

---

## 🌟 Highlights & Key Features

- **Google-Style Number Matching Challenge**:
  - Displays a prominent 2-digit matching number on the recovery screen (e.g., `47`).
  - Dispatches an authentic security alert email with 3 selectable options (`[19] [47] [63]`).
  - When the user taps the matching number on their device/email, the recovery page **automatically detects the match in real time** (via live status polling) and seamlessly progresses to the password reset screen!
- **Alternative Recovery Methods ("Try Another Way")**:
  - **Last Remembered Password**: Supports checking the user's current or previous password history (matching Google's exact recovery prompt).
  - **6-Digit Verification Code (OTP)**: Segmented code input with countdown timer and resend capability.
  - **Contact Admin / Support**: Direct escalation path for enterprise users.
- **Password Reset & Security Meter**:
  - Live interactive password strength score (Weak &rarr; Strong).
  - 4-point requirement checklist (8+ characters, upper/lowercase, numbers, special characters).
  - Password match confirmation.
  - Automatic archiving of previous passwords to prevent reuse.
- **Success & Session Invalidation**:
  - Canvas confetti celebration.
  - Automatic invalidation of sessions across other devices.
  - Detailed security audit overview.
- **Dual Email Delivery (Real SMTP + Built-in Live Security Mailbox)**:
  - Supports live SMTP servers (SendGrid, Mailtrap, Resend, Gmail).
  - Includes a built-in **Live Security Mailbox Drawer** (`📬 Security Inbox`) on the UI, enabling instant inspection and interactive tapping of dispatched emails without needing third-party email delays!
- **Built-in Admin Panel & Audit Trail**:
  - System statistics (Users, Pending Recoveries, Completed Resets, Emails Dispatched).
  - User Directory and account status.
  - Active and historical recovery sessions.
  - Immutable Security Audit Logs (IP tracking, timestamps, failure attempts).

---

## 🛠️ Tech Stack

- **Backend**: Python 3.13 + **FastAPI** + **SQLAlchemy** + **SQLite** + **Bcrypt** + **Jinja2**
- **Frontend**: **React 19** + **Vite 6** + **Tailwind CSS v4** + **Lucide Icons** + **Canvas Confetti**
- **Architecture**: Decoupled RESTful API with CORS, proxy support, and real-time status polling.

---

## 🚀 Quick Start

### 1. Launch Everything in One Click (Windows)
Double-click `start.bat` or run:
```bat
start.bat
```
This automatically starts both the FastAPI backend (`http://localhost:8000`) and the Vite React frontend (`http://localhost:5173`).

---

### 2. Manual Startup

#### Backend
```bash
cd backend
.\venv\Scripts\activate
python run.py
```
- API Root: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

#### Frontend
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Pre-Configured Test Accounts

| Email | Username | Current Password | Past Password |
|---|---|---|---|
| `igwikejerome@gmail.com` | `igwikejerome` | `GonnitSecure2026!` | `OldPassword2025!` |
| `alex@gonnit.com` | `alex` | `AlexPass2026!` | - |
| `admin@gonnit.com` | `admin` | `AdminGonnit2026!` | - |

---

## 📡 API Endpoints Summary

### Recovery Flow
- `POST /api/recovery/lookup` &mdash; Lookup account and initiate Google-style matching challenge.
- `GET /api/recovery/status/{session_id}` &mdash; Real-time session status polling.
- `POST /api/recovery/verify-match-number` &mdash; Validate tapped match number.
- `POST /api/recovery/verify-last-password` &mdash; Validate last remembered password.
- `POST /api/recovery/verify-otp` &mdash; Validate 6-digit OTP code.
- `POST /api/recovery/switch-method` &mdash; Switch active recovery challenge.
- `POST /api/recovery/reset-password` &mdash; Apply new password.

### Mailbox & Testing
- `GET /api/emails/recent` &mdash; Retrieve recent security emails for preview.
- `POST /api/emails/verify-link` &mdash; One-click email button verification.

### Admin & Security
- `GET /api/admin/overview` &mdash; Dashboard summary statistics.
- `GET /api/admin/users` &mdash; Registered user directory.
- `GET /api/admin/sessions` &mdash; Historical recovery sessions.
- `GET /api/admin/audit-logs` &mdash; Security event audit logs.
