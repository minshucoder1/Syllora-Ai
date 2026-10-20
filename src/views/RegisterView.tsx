import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  Calendar,
  Languages,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';
import { PhoneInput, validatePhoneInput } from '../components/PhoneInput';

export const RegisterView: React.FC = () => {
  const { register, navigateTo, showToast } = useApp();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Academic states
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('2nd Year');
  const [semester, setSemester] = useState('4th Semester');
  const [preferredLanguage, setPreferredLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [examDate, setExamDate] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time password validation calculations
  const passwordRules = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    if (!password) return { label: 'None', score: 0, color: 'bg-[#EEEAF4]' };
    const checks = [
      passwordRules.minLength,
      passwordRules.hasUpper,
      passwordRules.hasLower,
      passwordRules.hasNumber,
    ];
    const passed = checks.filter(Boolean).length;

    if (passed === 4 && password.length >= 12 && /[^A-Za-z0-9]/.test(password)) {
      return { label: 'Strong', score: 3, color: 'bg-[#319B78]', text: 'text-[#319B78]' };
    }
    if (passed === 4) {
      return { label: 'Medium', score: 2, color: 'bg-[#E5A044]', text: 'text-[#E5A044]' };
    }
    return { label: 'Weak', score: 1, color: 'bg-rose-500', text: 'text-rose-500' };
  }, [password, passwordRules]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPhoneError(null);

    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Mobile Number validation
    const phoneVal = validatePhoneInput(phoneCountryCode, phoneNumber);
    if (!phoneVal.valid) {
      setPhoneError(phoneVal.error || 'Please enter a valid mobile number.');
      setErrorMessage(phoneVal.error || 'Please enter a valid mobile number.');
      return;
    }

    if (!passwordRules.minLength || !passwordRules.hasUpper || !passwordRules.hasLower || !passwordRules.hasNumber) {
      setErrorMessage('Password does not satisfy all complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneCountryCode,
        phoneNumber: phoneVal.digits,
        phone: `${phoneCountryCode}${phoneVal.digits}`,
        password,
        confirmPassword,
        college: college.trim(),
        course,
        branch,
        year,
        semester,
        preferredLanguage,
        examDate: examDate || undefined,
      };

      const res = await register(payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed. Please review your details.');
      }
    } catch {
      setErrorMessage('Authentication service unavailable. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden bg-[#FFF9F2] text-[#28263A]">
      {/* Soft Pastel Ambient Glows */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-[#EAE5FF]/70 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#FFE0D2]/70 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#CFF5E7]/40 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 py-6">
        {/* Main Card */}
        <div className="rounded-3xl bg-white border border-[#EEEAF4] p-6 sm:p-10 shadow-[0_10px_35px_rgba(40,38,58,0.05)]">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#7C6EE6] text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>PASTEL BLOOM • DIRECT INSTANT ACTIVATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A] tracking-tight">
              Create Your Syllora AI Account
            </h1>
            <p className="text-xs sm:text-sm text-[#777589] max-w-md mx-auto">
              Start your personalized AI-powered learning journey. Direct instant access to your workspace — no email OTP delay.
            </p>
          </div>

          {/* Error Notification Alert */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-[#FFDCE8] border border-[#FFB8D2] flex items-start gap-2.5 text-rose-800 text-xs animate-shake text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#7C6EE6] uppercase tracking-wider flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#EAE5FF] text-[#7C6EE6]">01</span>
                <span>Account Credentials</span>
                <span className="h-px flex-1 bg-[#EEEAF4]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Minshu Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Email Address <span className="text-rose-500">*</span>
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
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Number Field (Required) */}
              <PhoneInput
                countryCode={phoneCountryCode}
                onCountryCodeChange={(code) => {
                  setPhoneCountryCode(code);
                  setPhoneError(null);
                }}
                phoneNumber={phoneNumber}
                onPhoneNumberChange={(num) => {
                  setPhoneNumber(num);
                  setPhoneError(null);
                }}
                error={phoneError}
                required
              />

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Confirm Password <span className="text-rose-500">*</span>
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
              </div>

              {/* Password Strength Meter & Real-time Checklist */}
              {password && (
                <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#EEEAF4] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777589] font-medium">Password Strength:</span>
                    <span className={`font-bold ${passwordStrength.text || 'text-[#777589]'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* 3-segment strength bar */}
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

                  {/* Checklist */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordRules.minLength ? 'text-[#319B78] font-medium' : 'text-[#777589]'
                      }`}
                    >
                      {passwordRules.minLength ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#319B78]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-[#D9D2F8] shrink-0" />
                      )}
                      <span>Minimum 8 characters</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordRules.hasUpper ? 'text-[#319B78] font-medium' : 'text-[#777589]'
                      }`}
                    >
                      {passwordRules.hasUpper ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#319B78]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-[#D9D2F8] shrink-0" />
                      )}
                      <span>At least one uppercase</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordRules.hasLower ? 'text-[#319B78] font-medium' : 'text-[#777589]'
                      }`}
                    >
                      {passwordRules.hasLower ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#319B78]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-[#D9D2F8] shrink-0" />
                      )}
                      <span>At least one lowercase</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordRules.hasNumber ? 'text-[#319B78] font-medium' : 'text-[#777589]'
                      }`}
                    >
                      {passwordRules.hasNumber ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#319B78]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-[#D9D2F8] shrink-0" />
                      )}
                      <span>At least one number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Academic Information */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-bold text-[#7C6EE6] uppercase tracking-wider flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#EAE5FF] text-[#7C6EE6]">02</span>
                <span>Academic Profile</span>
                <span className="h-px flex-1 bg-[#EEEAF4]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* College / University */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    College / University
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. National Institute of Technology / Delhi University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Course */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Course / Degree
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                  >
                    <option value="B.Tech">B.Tech / B.E.</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="BCA">BCA</option>
                    <option value="M.Tech">M.Tech / M.E.</option>
                    <option value="MCA">MCA</option>
                    <option value="M.Sc">M.Sc</option>
                    <option value="Diploma">Diploma / Polytechnic</option>
                    <option value="Other">Other Academic Program</option>
                  </select>
                </div>

                {/* Branch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Branch / Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science, AI, Mechanical"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                  />
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Current Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>

                {/* Semester */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                  >
                    <option value="1st Semester">Semester 1</option>
                    <option value="2nd Semester">Semester 2</option>
                    <option value="3rd Semester">Semester 3</option>
                    <option value="4th Semester">Semester 4</option>
                    <option value="5th Semester">Semester 5</option>
                    <option value="6th Semester">Semester 6</option>
                    <option value="7th Semester">Semester 7</option>
                    <option value="8th Semester">Semester 8</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Study Preferences */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-bold text-[#7C6EE6] uppercase tracking-wider flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#EAE5FF] text-[#7C6EE6]">03</span>
                <span>Preferences & Exam Target</span>
                <span className="h-px flex-1 bg-[#EEEAF4]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Preferred Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Preferred Language for Explanations
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['English', 'Hindi', 'Hinglish'] as const).map((lang) => (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => setPreferredLanguage(lang)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          preferredLanguage === lang
                            ? 'bg-[#EAE5FF] border-[#7C6EE6] text-[#7C6EE6] shadow-xs'
                            : 'bg-[#FFFDF9] border-[#EEEAF4] text-[#777589] hover:text-[#28263A]'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Exam Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28263A] block">
                    Exam Date <span className="text-[#777589] text-[11px] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating Your Syllora AI Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#777589] pt-1 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#319B78] shrink-0" />
              <span>Direct Dashboard Access • Immediate Session Activation • No OTP Delay</span>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EEEAF4]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white px-3 text-[#777589] font-semibold">
                OR REGISTER WITH
              </span>
            </div>
          </div>

          {/* Official Google Sign-In */}
          <GoogleSignInButton
            label="Continue with Google"
            onSuccess={() => {
              showToast('Account connected via Google!', 'success');
            }}
            onError={(err) => {
              setErrorMessage(err);
            }}
          />

          {/* Switch to Login */}
          <div className="mt-6 pt-4 border-t border-[#EEEAF4] text-center">
            <p className="text-xs text-[#777589]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigateTo('/login')}
                className="font-bold text-[#7C6EE6] hover:text-[#6b5cd8] ml-1 transition-colors hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
