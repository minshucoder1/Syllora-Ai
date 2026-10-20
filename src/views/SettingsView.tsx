import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PhoneInput, validatePhoneInput } from '../components/PhoneInput';
import {
  Settings,
  User,
  Bell,
  Shield,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, token, refreshUser, showToast, logout } = useApp();

  const [name, setName] = useState(user?.name || 'Minshu Kumar');
  const [college, setCollege] = useState(user?.college || 'National Institute of Technology');
  const [phoneCountryCode, setPhoneCountryCode] = useState(user?.phoneCountryCode || '+91');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>(
    user?.preferredLanguage || 'English'
  );
  const [examDate, setExamDate] = useState(user?.examDate || '2026-11-20');
  const [shareStats, setShareStats] = useState(user?.privacyShareStats ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setPhoneError(null);

    // Validate phone number if entered
    let validatedDigits = phoneNumber;
    if (phoneNumber.trim()) {
      const phoneVal = validatePhoneInput(phoneCountryCode, phoneNumber);
      if (!phoneVal.valid) {
        setPhoneError(phoneVal.error || 'Please enter a valid mobile number.');
        showToast(phoneVal.error || 'Please enter a valid mobile number.', 'error');
        return;
      }
      validatedDigits = phoneVal.digits;
    }

    setSaving(true);
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          name,
          college,
          phoneCountryCode,
          phoneNumber: validatedDigits,
          preferredLanguage: language,
          examDate,
          privacyShareStats: shareStats,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Settings saved successfully!', 'success');
        await refreshUser();
      } else {
        showToast(data.error || 'Error saving settings.', 'error');
      }
    } catch {
      showToast('Error saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between p-6 rounded-2xl glass-panel-heavy border border-red-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <Settings className="w-4 h-4 text-red-500" />
            <span>PREFERENCES & ACCOUNT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Platform Settings</h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-red-glow flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Account Details */}
      <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 text-red-400">
          <User className="w-4 h-4" />
          <span>Student Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Full Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">College / University:</label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Upcoming Exam Date:</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Preferred AI Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full bg-[#0a0a14] border border-red-950/60 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Hinglish">Hinglish (Hindi + English)</option>
            </select>
          </div>
        </div>

        {/* Mobile Number */}
        <div className="pt-2">
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
            required={false}
            label="Verified Contact Mobile Number"
          />
        </div>
      </div>

      {/* Privacy & Benchmark Controls */}
      <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 text-red-400">
          <Shield className="w-4 h-4" />
          <span>Privacy & Peer Benchmarking</span>
        </h2>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0a14] border border-zinc-900">
          <div>
            <div className="text-xs font-bold text-white">Share Academic Progress in Study Groups</div>
            <div className="text-[11px] text-zinc-400">
              Only your topic completion percentage and quiz accuracy will be visible to group peers.
            </div>
          </div>
          <input
            type="checkbox"
            checked={shareStats}
            onChange={(e) => setShareStats(e.target.checked)}
            className="w-4 h-4 accent-red-600 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Account & Security Section */}
      <div className="glass-panel-heavy rounded-2xl p-6 border border-red-950/40 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 text-red-400">
          <Shield className="w-4 h-4" />
          <span>Account & Security</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0a0a14] border border-zinc-900">
          <div className="space-y-1">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Signed in as:</span>
              <span className="text-red-400 font-mono">{user?.email || 'student@studyai.app'}</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Session secured with authenticated token. Logging out will clear your local access.
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 text-rose-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
          >
            Log Out of StudyAI
          </button>
        </div>
      </div>
    </div>
  );
};
