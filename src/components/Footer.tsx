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
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-[#777589]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white p-0.5 border border-[#EEEAF4] shadow-xs shrink-0">
                <img
                  src="/syllora-logo.png"
                  alt="SYLLORA AI Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <span className="font-bold text-[#182F53]">SYLLORA AI</span>
            </div>
            <span className="hidden sm:inline text-[#EEEAF4]">|</span>
            <span>© 2026. All rights reserved.</span>
            <span className="hidden sm:inline text-[#EEEAF4]">|</span>
            <span className="flex items-center gap-1.5 font-medium text-[#28263A]">
              Made by{' '}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAE5FF] border border-[#D9D2F8] text-[#182F53] font-semibold shadow-sm cursor-default">
                <Code2 className="w-3 h-3 text-[#159E9A]" />
                <span>Minshu Kumar</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl max-h-[85vh] rounded-3xl bg-white border border-[#EEEAF4] shadow-[0_20px_60px_rgba(40,38,58,0.12)] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-[#EEEAF4] flex items-center justify-between bg-[#FFFDF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EAE5FF] border border-[#D9D2F8] flex items-center justify-center text-[#7C6EE6]">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#28263A]">
                    Syllora AI — Project Architecture & Specification
                  </h3>
                  <p className="text-[11px] text-[#777589] font-mono">
                    Pastel Bloom Design System & Engineering Blueprint
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSpecificationCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAE5FF] hover:bg-[#ded7ff] border border-[#D9D2F8] text-[#7C6EE6] text-xs font-semibold transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpecModal(false)}
                  className="p-1.5 rounded-xl text-[#777589] hover:text-[#28263A] hover:bg-[#EAE5FF]/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Spreadsheet Table */}
            <div className="flex-1 overflow-auto p-4 text-xs font-sans">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#EEEAF4] bg-[#FFFDF9] text-[#28263A] font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Feature</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Validation & Requirements</th>
                    <th className="py-2.5 px-3">Security & Storage</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEAF4] text-[#28263A]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">1. Authentication System</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/api/auth/*</td>
                    <td className="py-2.5 px-3 text-[#28263A]">PBKDF2 sha512 salted hashing, session token verification</td>
                    <td className="py-2.5 px-3 text-[#777589]">Constant-time password checks, no plain text</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">2. Login Gateway</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/login</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Email format, non-empty, Remember Me persistence</td>
                    <td className="py-2.5 px-3 text-[#777589]">Generic non-enumerating error messages</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">3. Registration</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/register</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Name, Email, Academic details, Language, Exam Date</td>
                    <td className="py-2.5 px-3 text-[#777589]">Duplicate email prevention (HTTP 409)</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">4. Password Requirements</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/register</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</td>
                    <td className="py-2.5 px-3 text-[#777589]">Live entropy meter (Weak/Medium/Strong)</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">5. Google OAuth</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/api/auth/google</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Official GIS token exchange, auto-profile creation</td>
                    <td className="py-2.5 px-3 text-[#777589]">Never store Google passwords, JWT payload verification</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">6. Email Verification</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/verify-email</td>
                    <td className="py-2.5 px-3 text-[#28263A]">6-digit code verification, 60s cooldown on resend</td>
                    <td className="py-2.5 px-3 text-[#777589]">Blocks unverified sessions from protected areas</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">7. Forgot Password</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/forgot-password</td>
                    <td className="py-2.5 px-3 text-[#28263A]">15-minute secure token expiry, non-enumerating message</td>
                    <td className="py-2.5 px-3 text-[#777589]">Does not reveal if email exists in database</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">8. Reset Password</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/reset-password</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Token validity check, new password matching</td>
                    <td className="py-2.5 px-3 text-[#777589]">Invalidates token on update, purges prior sessions</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">9. Session Management</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">All routes</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Persistent token restoration on page refresh</td>
                    <td className="py-2.5 px-3 text-[#777589]">Server sessions table with auto-expiry purge</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">10. Protected Routes</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/dashboard, etc.</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Redirects unauthenticated visitors to /login</td>
                    <td className="py-2.5 px-3 text-[#777589]">Remembers intended route for post-login redirection</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">11. User Profile</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/profile</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Academic details, streak counter, level, XP, privacy</td>
                    <td className="py-2.5 px-3 text-[#777589]">Users can only access their own profile</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">12. Onboarding</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">/onboarding</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Prompts for missing academic metadata for Google signups</td>
                    <td className="py-2.5 px-3 text-[#777589]">Requires session authentication to save</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">13. Logout</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">Navbar/Sidebar/Settings</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Revokes server session, clears client token</td>
                    <td className="py-2.5 px-3 text-[#777589]">Full invalidation; redirect to /login</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">14. Authorization & Security</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">All APIs</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Multi-tenant data isolation scoped to userId</td>
                    <td className="py-2.5 px-3 text-[#777589]">Disallows reading or mutating other students' content</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">15. Database Schema</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">server/db.ts</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Profiles, Users, Sessions, Roadmaps, Subjects</td>
                    <td className="py-2.5 px-3 text-[#777589]">Salts and hashes segregated server-side</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#28263A]">16. UI Design</td>
                    <td className="py-2.5 px-3 font-mono text-[#777589]">Global</td>
                    <td className="py-2.5 px-3 text-[#28263A]">Pastel Bloom theme, soft lavender, mint green, warm cream canvas</td>
                    <td className="py-2.5 px-3 text-[#777589]">WCAG AA contrast, gentle pastel transitions</td>
                    <td className="py-2.5 px-3"><span className="text-[#319B78] font-bold font-mono">Completed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EEEAF4] bg-[#FFFDF9] flex items-center justify-between text-xs text-[#777589]">
              <span>Documentation file: <code className="text-[#7C6EE6] font-mono">docs/PROJECT_SPECIFICATION.csv</code></span>
              <button
                type="button"
                onClick={() => setShowSpecModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#EAE5FF] hover:bg-[#ded7ff] text-[#7C6EE6] font-bold transition-colors"
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
