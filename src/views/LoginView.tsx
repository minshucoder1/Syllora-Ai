import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  BrainCircuit,
  GraduationCap,
  Layers,
  BookOpen,
  Calendar,
  Compass,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, navigateTo, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password, rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch {
      setErrorMessage('Authentication service unavailable. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-[#FFF9F2] text-[#28263A]">
      {/* Soft Pastel Ambient Glows */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-[#EAE5FF]/70 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#FFE0D2]/70 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#CFF5E7]/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Main 2-column container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* LEFT SIDE: Syllora AI Pastel Branding & Highlights */}
        <div className="lg:col-span-6 space-y-6 lg:pr-4 text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#7C6EE6] text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#7C6EE6]" />
            <span>PASTEL BLOOM • STUDENT-FRIENDLY AI</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-white p-1 shadow-[0_4px_16px_rgba(24,47,83,0.15)] border border-[#EEEAF4] shrink-0">
                <img
                  src="/syllora-logo.png"
                  alt="SYLLORA AI Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#182F53] tracking-tight flex items-center gap-1">
                  SYLLORA <span className="text-[#159E9A]">AI</span>
                  <span className="text-[#D9A441] text-xs -mt-2">✦</span>
                </h1>
                <p className="text-xs text-[#777589] font-medium">Your AI Study Companion • By Minshu Kumar</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#28263A] tracking-tight leading-snug">
              Welcome back! <br />
              <span className="text-[#7C6EE6]">
                Ready to learn something new?
              </span>
            </h2>

            <p className="text-sm text-[#777589] leading-relaxed max-w-lg">
              Syllora AI translates your college curriculum into structured study roadmaps, Hinglish doubt breakdowns, high-scoring exam questions, and peaceful study sessions.
            </p>
          </div>

          {/* Feature Highlights Grid in Soft Pastel Colors */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-[#EEEAF4] shadow-[0_4px_16px_rgba(40,38,58,0.03)] hover:border-[#D9D2F8] transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5 text-[#28263A] font-bold text-xs">
                <div className="w-6 h-6 rounded-lg bg-[#EAE5FF] text-[#7C6EE6] flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <span>Study Roadmaps</span>
              </div>
              <p className="text-[11px] text-[#777589] leading-relaxed">
                Step-by-step topic sequencing with prerequisites, milestones, and difficulty labels.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EEEAF4] shadow-[0_4px_16px_rgba(40,38,58,0.03)] hover:border-[#A9E8D2] transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5 text-[#28263A] font-bold text-xs">
                <div className="w-6 h-6 rounded-lg bg-[#CFF5E7] text-[#319B78] flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Verified Accuracy</span>
              </div>
              <p className="text-[11px] text-[#777589] leading-relaxed">
                Exam-oriented derivations, 2M/5M/10M model answers, and numerical step solutions.
              </p>
            </div>
          </div>

          <div className="pt-1 text-xs text-[#777589] flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#319B78] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#319B78]" /> 100% Student Friendly
            </span>
            <span className="flex items-center gap-1.5 text-[#7C6EE6] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7C6EE6]" /> Zero Distraction Layout
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Hinglish + English
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: Pastel Bloom Login Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="relative rounded-3xl bg-white border border-[#EEEAF4] p-6 sm:p-8 shadow-[0_10px_35px_rgba(40,38,58,0.05)]">
            
            {/* Header */}
            <div className="space-y-1 mb-6 text-left">
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#FFF0B8] text-amber-900 text-[10px] font-bold tracking-wide uppercase mb-1">
                STUDENT PORTAL
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#28263A] tracking-tight">
                Sign In
              </h3>
              <p className="text-xs text-[#777589]">
                Access your personalized study workspace and notes.
              </p>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-[#FFDCE8] border border-[#FFB8D2] flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
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
                    autoComplete="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Field with Show/Hide toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#28263A]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigateTo('/forgot-password')}
                    className="text-xs text-[#7C6EE6] hover:text-[#6b5cd8] font-medium transition-colors hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#777589] hover:text-[#28263A] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#EEEAF4] bg-white text-[#7C6EE6] focus:ring-[#7C6EE6] cursor-pointer accent-[#7C6EE6]"
                  />
                  <span className="text-xs text-[#777589]">Remember me on this device</span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Syllora</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EEEAF4]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-white px-3 text-[#777589] font-semibold">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            {/* Official Google Sign-In */}
            <GoogleSignInButton
              label="Continue with Google"
              onSuccess={() => {
                showToast('Signed in with Google successfully!', 'success');
              }}
              onError={(err) => {
                setErrorMessage(err);
              }}
            />

            {/* Switch to Register */}
            <div className="mt-6 pt-4 border-t border-[#EEEAF4] text-center">
              <p className="text-xs text-[#777589]">
                New to Syllora AI?{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('/register')}
                  className="font-bold text-[#7C6EE6] hover:text-[#6b5cd8] ml-1 transition-colors hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
