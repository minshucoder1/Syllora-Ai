import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Shield,
} from 'lucide-react';

export const ForgotPasswordView: React.FC = () => {
  const { forgotPassword, navigateTo, setResetTokenForView } = useApp();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res.success) {
        setIsSubmitted(true);
        setSuccessMessage(res.message);
        if (res.devResetToken) {
          setDevToken(res.devResetToken);
          setResetTokenForView(res.devResetToken);
        }
      } else {
        setErrorMessage(res.error || 'Failed to process password reset request.');
      }
    } catch {
      setErrorMessage('Network error: Unable to contact authentication service.');
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
          
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigateTo('/login')}
            className="inline-flex items-center gap-1.5 text-xs text-[#777589] hover:text-[#28263A] transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Sign In</span>
          </button>

          {/* Header */}
          <div className="space-y-2 mb-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#7C6EE6] text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>SECURITY RECOVERY</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#28263A] tracking-tight">
              Forgot your password?
            </h1>
            <p className="text-xs text-[#777589] leading-relaxed">
              Enter your email address and we will send you secure instructions to reset your password.
            </p>
          </div>

          {/* Error Notification Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-2xl bg-[#FFDCE8] border border-[#FFB8D2] flex items-start gap-2.5 text-rose-800 text-xs animate-shake text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#28263A] block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success confirmation */
            <div className="space-y-5 text-left animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#CFF5E7] border border-[#A9E8D2] flex items-start gap-3 text-[#319B78]">
                <CheckCircle2 className="w-5 h-5 text-[#319B78] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#28263A]">
                    {successMessage || 'Password reset instructions have been sent to your email.'}
                  </p>
                  <p className="text-[11px] text-[#777589] leading-relaxed">
                    If an account matches <span className="text-[#28263A] font-semibold">{email}</span>, you will receive a secure 15-minute reset link.
                  </p>
                </div>
              </div>

              {/* Dev mode simulation helper */}
              {devToken && (
                <div className="p-3.5 rounded-2xl bg-[#EAE5FF] border border-[#D9D2F8] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7C6EE6]">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Workspace Simulation Link</span>
                  </div>
                  <p className="text-[11px] text-[#777589] leading-relaxed">
                    Reset token generated for preview testing:
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('/reset-password')}
                    className="w-full py-2 px-3 rounded-xl bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white text-xs font-bold text-center transition-colors truncate cursor-pointer shadow-xs"
                  >
                    Click to Open /reset-password
                  </button>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo('/login')}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#FFFDF9] border border-[#EEEAF4] text-[#28263A] font-bold text-xs sm:text-sm text-center transition-all cursor-pointer shadow-xs"
                >
                  Back to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs text-[#777589] hover:text-[#28263A] text-center transition-colors cursor-pointer"
                >
                  Didn't receive email? Try another address
                </button>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-[#EEEAF4] text-center">
            <p className="text-[11px] text-[#777589]">
              Need help? Contact support@syllora.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
