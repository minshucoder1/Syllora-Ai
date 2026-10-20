import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  X,
  Download,
  Code2,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useApp();
  const [showSpecModal, setShowSpecModal] = useState(false);

  const downloadSpecificationCsv = () => {
    window.open('/api/docs/specification.csv', '_blank');
  };

  return (
    <>
      <footer className="w-full border-t border-[#EEEAF4] bg-[#FFFDF9]/95 backdrop-blur-md py-6 px-4 sm:px-8 mt-auto z-20 relative">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          
          {/* Main Copyright & Creator Attribution */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#777589]">
            <span>© 2026 Syllora AI. All rights reserved.</span>
            <span className="hidden sm:inline text-[#EEEAF4]">|</span>
            <span className="flex items-center gap-1.5 font-medium text-[#28263A]">
              Made by{' '}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#7C6EE6] font-semibold shadow-sm cursor-default">
                <Code2 className="w-3 h-3 text-[#7C6EE6]" />
                <span>Minshu Coder</span>
              </span>
            </span>
          </div>

          {/* Quick Links & Spec Spreadsheet Access */}
          <div className="flex items-center gap-4 text-xs text-[#777589]">
            <button
              onClick={() => setShowSpecModal(true)}
              className="flex items-center gap-1.5 text-[#777589] hover:text-[#7C6EE6] transition-colors"
              title="View Authentication & System Architecture Spec"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#7C6EE6]" />
              <span>Project Spec Sheet</span>
            </button>
            <span className="text-[#EEEAF4]">·</span>
            <span className="text-[11px] text-[#777589]">
              v2.4.0 <span className="text-[#777589]">/</span> Pastel Bloom
            </span>
          </div>
        </div>
      </footer>

      {/* Project Specification Spreadsheet Modal */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-3xl bg-[#0a0a14] border border-red-950/80 shadow-[0_0_60px_rgba(239,68,68,0.2)] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-[#08080f]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-800/50 flex items-center justify-center text-red-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Syllora AI — Project Architecture & Auth Specification
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Section: AUTHENTICATION / LOGIN & SIGNUP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSpecificationCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-semibold transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpecModal(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Spreadsheet Table */}
            <div className="flex-1 overflow-auto p-4 text-xs font-sans">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-300 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Feature</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Validation & Requirements</th>
                    <th className="py-2.5 px-3">Security & Storage</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/80 text-zinc-300">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">1. Authentication System</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/api/auth/*</td>
                    <td className="py-2.5 px-3 text-zinc-300">PBKDF2 sha512 salted hashing, session token verification</td>
                    <td className="py-2.5 px-3 text-zinc-400">Constant-time password checks, no plain text</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">2. Login Gateway</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/login</td>
                    <td className="py-2.5 px-3 text-zinc-300">Email format, non-empty, Remember Me persistence</td>
                    <td className="py-2.5 px-3 text-zinc-400">Generic non-enumerating error messages</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">3. Registration</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/register</td>
                    <td className="py-2.5 px-3 text-zinc-300">Name, Email, Academic details, Language, Exam Date</td>
                    <td className="py-2.5 px-3 text-zinc-400">Duplicate email prevention (HTTP 409)</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">4. Password Requirements</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/register</td>
                    <td className="py-2.5 px-3 text-zinc-300">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</td>
                    <td className="py-2.5 px-3 text-zinc-400">Live entropy meter (Weak/Medium/Strong)</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">5. Google OAuth</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/api/auth/google</td>
                    <td className="py-2.5 px-3 text-zinc-300">Official GIS token exchange, auto-profile creation</td>
                    <td className="py-2.5 px-3 text-zinc-400">Never store Google passwords, JWT payload verification</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">6. Email Verification</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/verify-email</td>
                    <td className="py-2.5 px-3 text-zinc-300">6-digit code verification, 60s cooldown on resend</td>
                    <td className="py-2.5 px-3 text-zinc-400">Blocks unverified sessions from protected areas</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">7. Forgot Password</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/forgot-password</td>
                    <td className="py-2.5 px-3 text-zinc-300">15-minute secure token expiry, non-enumerating message</td>
                    <td className="py-2.5 px-3 text-zinc-400">Does not reveal if email exists in database</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">8. Reset Password</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/reset-password</td>
                    <td className="py-2.5 px-3 text-zinc-300">Token validity check, new password matching</td>
                    <td className="py-2.5 px-3 text-zinc-400">Invalidates token on update, purges prior sessions</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">9. Session Management</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">All routes</td>
                    <td className="py-2.5 px-3 text-zinc-300">Persistent token restoration on page refresh</td>
                    <td className="py-2.5 px-3 text-zinc-400">Server sessions table with auto-expiry purge</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">10. Protected Routes</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/dashboard, etc.</td>
                    <td className="py-2.5 px-3 text-zinc-300">Redirects unauthenticated visitors to /login</td>
                    <td className="py-2.5 px-3 text-zinc-400">Remembers intended route for post-login redirection</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">11. User Profile</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/profile</td>
                    <td className="py-2.5 px-3 text-zinc-300">Academic details, streak counter, level, XP, privacy</td>
                    <td className="py-2.5 px-3 text-zinc-400">Users can only access their own profile</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">12. Onboarding</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">/onboarding</td>
                    <td className="py-2.5 px-3 text-zinc-300">Prompts for missing academic metadata for Google signups</td>
                    <td className="py-2.5 px-3 text-zinc-400">Requires session authentication to save</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">13. Logout</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">Navbar/Sidebar/Settings</td>
                    <td className="py-2.5 px-3 text-zinc-300">Revokes server session, clears client token</td>
                    <td className="py-2.5 px-3 text-zinc-400">Full invalidation; redirect to /login</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">14. Authorization & Security</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">All APIs</td>
                    <td className="py-2.5 px-3 text-zinc-300">Multi-tenant data isolation scoped to userId</td>
                    <td className="py-2.5 px-3 text-zinc-400">Disallows reading or mutating other students' content</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">15. Database Schema</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">server/db.ts</td>
                    <td className="py-2.5 px-3 text-zinc-300">Profiles, Users, Sessions, Roadmaps, Subjects</td>
                    <td className="py-2.5 px-3 text-zinc-400">Salts and hashes segregated server-side</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">16. UI Design</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">Global</td>
                    <td className="py-2.5 px-3 text-zinc-300">Deep black background, crimson glow, glassmorphism</td>
                    <td className="py-2.5 px-3 text-zinc-400">WCAG AA contrast, prefers-reduced-motion supported</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">17. Loading States</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">Global</td>
                    <td className="py-2.5 px-3 text-zinc-300">"Signing you in...", "Restoring your session...", etc.</td>
                    <td className="py-2.5 px-3 text-zinc-400">Duplicate submission prevention</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-white">18. Footer Copyright</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">Global Footer</td>
                    <td className="py-2.5 px-3 text-zinc-300">© 2026 Syllora AI. All rights reserved. | Made by Minshu Coder</td>
                    <td className="py-2.5 px-3 text-zinc-400">Prominent professional Minshu Coder attribution</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-400 font-semibold font-mono">Completed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-[#08080f] flex items-center justify-between text-xs text-zinc-400">
              <span>Documentation file: <code className="text-red-400 font-mono">docs/PROJECT_SPECIFICATION.csv</code></span>
              <button
                type="button"
                onClick={() => setShowSpecModal(false)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
