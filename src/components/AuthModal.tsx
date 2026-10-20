import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  X,
  Sparkles,
  Lock,
  Mail,
  User,
  GraduationCap,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    register,
    navigateTo,
    showToast,
  } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          setIsAuthModalOpen(false);
        } else {
          showToast(res.error || 'Authentication failed. Please verify credentials.', 'error');
        }
      } else {
        const res = await register({
          name,
          email,
          password,
          confirmPassword: password,
          college,
          course,
          branch,
        });
        if (res.success) {
          setIsAuthModalOpen(false);
        } else {
          showToast(res.error || 'Registration failed. Please check password requirements.', 'error');
        }
      }
    } catch {
      showToast('Authentication service error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFullPage = () => {
    setIsAuthModalOpen(false);
    navigateTo(authMode === 'login' ? '/login' : '/register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_15px_50px_rgba(40,38,58,0.12)] relative space-y-6 text-[#28263A]">
        
        {/* Top controls */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenFullPage}
            title="Open dedicated page"
            className="p-2 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#FFF9F2] transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="p-2 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#FFF9F2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#7C6EE6] text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-[#7C6EE6]" />
            <span>SYLLORA AI SECURE ACCESS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#28263A]">
            {authMode === 'login' ? 'Welcome Back!' : 'Join Syllora AI Today'}
          </h2>
          <p className="text-xs text-[#777589]">
            {authMode === 'login'
              ? 'Continue your exam preparation with your personalized notes.'
              : 'Create your account to start generating syllabus study material.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {authMode === 'register' && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-[#28263A] block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#777589] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Minshu Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#28263A] block mb-1">College / University</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-[#777589] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="NIT / University Name"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[#28263A] block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#777589] absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#28263A]">Password</label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    navigateTo('/forgot-password');
                  }}
                  className="text-[11px] text-[#7C6EE6] hover:text-[#6b5cd8] transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777589] absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-[#FFFDF9] border border-[#EEEAF4] rounded-xl text-xs text-[#28263A] focus:outline-none focus:border-[#7C6EE6] focus:ring-2 focus:ring-[#7C6EE6]/20 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#777589] hover:text-[#28263A] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#7C6EE6] hover:bg-[#6b5cd8] shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all cursor-pointer"
          >
            {loading ? 'Authenticating...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="pt-1">
          <GoogleSignInButton
            label="Continue with Google"
            onSuccess={() => setIsAuthModalOpen(false)}
          />
        </div>

        <div className="text-center pt-2 border-t border-[#EEEAF4]">
          <button
            type="button"
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-xs text-[#777589] hover:text-[#28263A] cursor-pointer"
          >
            {authMode === 'login' ? (
              <>
                Don't have an account? <span className="text-[#7C6EE6] font-bold">Register</span>
              </>
            ) : (
              <>
                Already registered? <span className="text-[#7C6EE6] font-bold">Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
