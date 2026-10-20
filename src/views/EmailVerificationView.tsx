import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const EmailVerificationView: React.FC = () => {
  const {
    user,
    navigateTo,
    showToast,
  } = useApp();

  useEffect(() => {
    // If the user is already authenticated, automatically route them to dashboard
    if (user) {
      const timer = setTimeout(() => {
        navigateTo('/dashboard');
        showToast('Your Syllora AI account is active and verified!', 'success');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user, navigateTo, showToast]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-[#FFF9F2] text-[#28263A]">
      {/* Soft Pastel Ambient Glows */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-[#CFF5E7]/70 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#EAE5FF]/70 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl bg-white border border-[#EEEAF4] p-6 sm:p-8 shadow-[0_10px_35px_rgba(40,38,58,0.05)] text-left">
          
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigateTo(user ? '/dashboard' : '/login')}
            className="inline-flex items-center gap-1.5 text-xs text-[#777589] hover:text-[#28263A] transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>{user ? 'Back to Dashboard' : 'Back to Sign In'}</span>
          </button>

          {/* Header */}
          <div className="space-y-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#CFF5E7] flex items-center justify-center text-[#319B78] shadow-sm mb-2">
              <CheckCircle2 className="w-6 h-6 text-[#319B78]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CFF5E7] border border-[#A9E8D2] text-[#319B78] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#319B78]" />
              <span>DIRECT ACCESS ACTIVE</span>
            </div>

            <h1 className="text-2xl font-extrabold text-[#28263A] tracking-tight">
              Direct Signup Activated
            </h1>
            <p className="text-xs text-[#777589] leading-relaxed">
              Email OTP delays have been removed. Syllora AI accounts are instantly activated upon registration with persistent login sessions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] mb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#28263A]">
              <ShieldCheck className="w-4 h-4 text-[#319B78] shrink-0" />
              <span>Instant Workspace Access</span>
            </div>
            <p className="text-[11px] text-[#777589] leading-relaxed">
              Your profile is active. You have instant access to study roadmaps, exam predictions, numerical walkthroughs, and personal notes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (user) {
                navigateTo('/dashboard');
              } else {
                navigateTo('/login');
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{user ? 'Continue to Dashboard' : 'Sign In to Your Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!user && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigateTo('/register')}
                className="text-xs text-[#777589] hover:text-[#7C6EE6] transition-colors cursor-pointer"
              >
                Need an account? Register here
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
