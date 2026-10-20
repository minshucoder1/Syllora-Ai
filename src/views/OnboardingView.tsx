import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PhoneInput, validatePhoneInput } from '../components/PhoneInput';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  Languages,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const { user, completeOnboarding } = useApp();

  const [college, setCollege] = useState(user?.college || '');
  const [course, setCourse] = useState(user?.course || 'B.Tech');
  const [branch, setBranch] = useState(user?.branch || 'Computer Science');
  const [year, setYear] = useState(user?.year || '2nd Year');
  const [semester, setSemester] = useState(user?.semester || '4th Semester');
  const [preferredLanguage, setPreferredLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [examDate, setExamDate] = useState(user?.examDate || '');
  const [phoneCountryCode, setPhoneCountryCode] = useState(user?.phoneCountryCode || '+91');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPhoneError(null);

    if (!college.trim()) {
      setErrorMessage('Please provide your college or university name.');
      return;
    }

    // Mobile number validation (mandatory for completing profile)
    const phoneVal = validatePhoneInput(phoneCountryCode, phoneNumber);
    if (!phoneVal.valid) {
      setPhoneError(phoneVal.error || 'Please provide a valid mobile number to access your dashboard.');
      setErrorMessage(phoneVal.error || 'Please provide a valid mobile number to access your dashboard.');
      return;
    }

    setLoading(true);
    try {
      const res = await completeOnboarding({
        college: college.trim(),
        course,
        branch,
        year,
        semester,
        preferredLanguage,
        examDate: examDate || undefined,
        phoneCountryCode,
        phoneNumber: phoneVal.digits,
        phone: `${phoneCountryCode}${phoneVal.digits}`,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to complete profile onboarding.');
      }
    } catch {
      setErrorMessage('Network error: Unable to save profile information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-[#FFF9F2] text-[#28263A]">
      {/* Soft Pastel Ambient Glows */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-[#EAE5FF]/70 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[#FFE0D2]/70 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="rounded-3xl bg-white border border-[#EEEAF4] p-6 sm:p-10 shadow-[0_10px_35px_rgba(40,38,58,0.05)] text-left">
          
          {/* Header */}
          <div className="space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#7C6EE6] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>STEP 2: ACADEMIC CALIBRATION</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#28263A] tracking-tight">
              Complete Your Syllora AI Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#777589] leading-relaxed">
              Welcome, <span className="text-[#28263A] font-bold">{user?.name}</span>! Tell us about your curriculum so Syllora AI can automatically calibrate notes, question banks, and predictions to your syllabus level.
            </p>
          </div>

          {/* Error Notification Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-2xl bg-[#FFDCE8] border border-[#FFB8D2] flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* College / University */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#28263A] block">
                College / University <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777589]">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Technology / University"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFDF9] border border-[#EEEAF4] focus:border-[#7C6EE6] rounded-xl text-xs sm:text-sm text-[#28263A] placeholder:text-[#777589]/60 focus:outline-none focus:ring-2 focus:ring-[#7C6EE6]/20 transition-all"
                />
              </div>
            </div>

            {/* Mobile Number Field (Mandatory) */}
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
              label="Mobile Number (Required for Workspace Access)"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <option value="Diploma">Diploma</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#28263A] block">
                  Branch / Department
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
                  Academic Year
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

            {/* Preferred Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#28263A] block">
                Preferred Explanation Language
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
                Target Exam Date <span className="text-[#777589] text-[11px] font-normal">(Optional)</span>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#7C6EE6] hover:bg-[#6b5cd8] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(124,110,230,0.3)] transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 pt-3 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving Academic Profile...</span>
                </>
              ) : (
                <>
                  <span>Save Profile & Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
