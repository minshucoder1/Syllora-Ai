import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

export const ResetPasswordView: React.FC = () => {
  const { resetPassword, navigateTo, resetTokenForView } = useApp();

  const [token, setToken] = useState(resetTokenForView || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check URL query parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get('token');
      if (queryToken) {
        setToken(queryToken);
      } else if (resetTokenForView) {
        setToken(resetTokenForView);
      }
    }
  }, [resetTokenForView]);

  // Real-time password validation calculations
  const passwordRules = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { label: 'None', score: 0, color: 'bg-[#EEEAF4]' };
    const checks = [
      passwordRules.minLength,
      passwordRules.hasUpper,
      passwordRules.hasLower,
      passwordRules.hasNumber,
    ];
    const passed = checks.filter(Boolean).length;

    if (passed === 4 && newPassword.length >= 12 && /[^A-Za-z0-9]/.test(newPassword)) {
      return { label: 'Strong', score: 3, color: 'bg-[#319B78]', text: 'text-[#319B78]' };
    }
    if (passed === 4) {
      return { label: 'Medium', score: 2, color: 'bg-[#E5A044]', text: 'text-[#E5A044]' };
    }
    return { label: 'Weak', score: 1, color: 'bg-rose-500', text: 'text-rose-500' };
  }, [newPassword, passwordRules]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage('A valid reset token is required. Please check your reset link or request a new one.');
      return;
    }

    if (!passwordRules.minLength || !passwordRules.hasUpper || !passwordRules.hasLower || !passwordRules.hasNumber) {
      setErrorMessage('Password does not satisfy all complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token.trim(), newPassword, confirmPassword);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || 'Failed to update password. Reset link may be expired.');
      }
    } catch {
      setErrorMessage('Authentication service unavailable. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-[#FFF9F2] text-[#28263A]">
      {/* Soft Pastel Ambient Glows */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-[#EAE5FF]/70 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#FFE0D2]/70 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl bg-white border border-[#EEEAF4] p-6 sm:p-8 shadow-[0_10px_35px_rgba(40,38,58,0.05)]">
          
          {/* Header */}
          <div className="space-y-2 mb-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#7C6EE6] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>SECURE ACCESS RECOVERY</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#28263A] tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs text-[#777589] leading-relaxed">
              Choose a strong, unique password to protect your Syllora AI account.
            </p>
          </div>

          {/* Error Notification Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-2xl bg-[#FFDCE8] border border-[#FFB8D2] flex items-start gap-2.5 text-rose-800 text-xs animate-shake text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="leading-snug block">{errorMessage}</span>
                {errorMessage.includes('expired') && (
                  <button
                    type="button"
                    onClick={() => navigateTo('/forgot-password')}
                    className="text-[11px] text-[#7C6EE6] underline hover:text-[#6b5cd8] block cursor-pointer"
                  >
                    Request a new password reset link →
                  </button>
                )}
              </div>
            </div>
          )}

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Reset Token Input */}
              {!token && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Reset Token / Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Paste your reset token here"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#28263A] block">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#777589] hover:text-[#28263A] transition-colors"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#28263A] block">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 bg-[#FFFDF9] border rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none transition-all font-mono ${
                      confirmPassword && !passwordsMatch
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : confirmPassword && passwordsMatch
                        ? 'border-[#319B78] focus:ring-2 focus:ring-[#CFF5E7]'
                        : 'border-[#EEEAF4] focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#777589] hover:text-[#28263A] transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {confirmPassword && (
                  <div className="flex items-center gap-1.5 text-[11px] pt-1">
                    {passwordsMatch ? (
                      <span className="text-[#319B78] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Password Strength Checklist */}
              {newPassword && (
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#777589]">Strength:</span>
                    <span className={`font-bold ${passwordStrength.text || 'text-[#777589]'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        passwordStrength.score >= 1 ? passwordStrength.color : 'bg-[#EEEAF4]'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all ${
                        passwordStrength.score >= 2 ? passwordStrength.color : 'bg-[#EEEAF4]'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all ${
                        passwordStrength.score >= 3 ? passwordStrength.color : 'bg-[#EEEAF4]'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Successful Reset State */
            <div className="space-y-6 text-left animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#CFF5E7] border border-[#A9E8D2] flex items-start gap-3 text-[#319B78]">
                <CheckCircle2 className="w-6 h-6 text-[#319B78] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#28263A]">
                    Password Updated
                  </h3>
                  <p className="text-xs text-[#777589] leading-relaxed">
                    Your password has been updated successfully.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('/login')}
                className="w-full py-3 px-4 rounded-xl bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-[#EEEAF4] text-center">
            <button
              type="button"
              onClick={() => navigateTo('/login')}
              className="text-xs text-[#777589] hover:text-[#28263A] transition-colors cursor-pointer"
            >
              Remembered your credentials? Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
