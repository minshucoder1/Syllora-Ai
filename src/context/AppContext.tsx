import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Subject } from '../types';
import confetti from 'canvas-confetti';

interface AppContextType {
  user: User | null;
  token: string | null;
  subjects: Subject[];
  activeSubject: Subject | null;
  setActiveSubject: (s: Subject | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navigateTo: (pathOrTab: string) => void;
  selectedTopicId: string | null;
  setSelectedTopicId: (id: string | null) => void;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  refreshUser: () => Promise<User | null>;
  refreshSubjects: () => Promise<void>;
  removeSubject: (subjectId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  archiveSubject: (subjectId: string, archived?: boolean) => Promise<boolean>;
  editSubject: (subjectId: string, updates: Partial<Subject>) => Promise<boolean>;
  subjectToRemove: Subject | null;
  setSubjectToRemove: (s: Subject | null) => void;
  subjectToEdit: Subject | null;
  setSubjectToEdit: (s: Subject | null) => void;
  toggleTopicCompleted: (topicId: string) => Promise<boolean>;
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  isAddSyllabusModalOpen: boolean;
  setIsAddSyllabusModalOpen: (open: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  triggerConfetti: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }>;
  register: (formData: any) => Promise<{ success: boolean; error?: string; details?: string[]; requiresEmailVerification?: boolean; verificationCode?: string }>;
  loginWithGoogle: (payload: { credential?: string; profile?: any }) => Promise<{ success: boolean; error?: string; requiresOnboarding?: boolean }>;
  completeOnboarding: (data: any) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; devResetToken?: string | null; error?: string }>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyEmail: (code: string, email?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resendVerification: (email?: string) => Promise<{ success: boolean; message?: string; error?: string; devVerificationCode?: string }>;
  logout: () => Promise<void>;
  openSyllabusFlow: () => void;
  authEmailForVerification: string;
  setAuthEmailForVerification: (email: string) => void;
  resetTokenForView: string;
  setResetTokenForView: (token: string) => void;
  isRestoringSession: boolean;
  isLoadingSubjects: boolean;
  subjectsError: string | null;
  retrySubjectAnalysis: (subjectId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  syncProfile: (profileData?: any) => Promise<{ success: boolean; error?: string }>;
}

export const PUBLIC_PAGES = [
  'landing',
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'verify-email',
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
  });
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => {
    return !!(typeof window !== 'undefined' && (localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token')));
  });
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  // Compute initial tab based on browser URL with strict authentication enforcement
  const computeInitialTab = (): string => {
    if (typeof window === 'undefined') return 'landing';
    const path = window.location.pathname;
    if (path === '/' || path === '/landing') return 'landing';
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/reset-password') return 'reset-password';
    if (path === '/verify-email') return 'verify-email';
    if (path === '/onboarding') return 'onboarding';

    const tab = path.startsWith('/') ? path.slice(1) : path;
    const hasToken = !!(localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token'));

    // If unauthenticated user opens any dashboard or private study URL directly:
    // Automatically redirect to /login and preserve requested destination
    if (!hasToken) {
      try {
        sessionStorage.setItem('syllora_intended_destination', path);
      } catch {}
      return 'login';
    }

    return tab || 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<string>(computeInitialTab);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAddSyllabusModalOpen, setIsAddSyllabusModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auth helper states
  const [authEmailForVerification, setAuthEmailForVerification] = useState<string>('');
  const [resetTokenForView, setResetTokenForView] = useState<string>('');

  const navigateTo = (pathOrTab: string) => {
    let targetTab = pathOrTab;
    let targetPath = pathOrTab;

    if (pathOrTab.startsWith('/')) {
      targetTab = pathOrTab.slice(1);
    } else {
      targetPath = `/${pathOrTab}`;
    }

    if (targetTab === 'dashboard') targetPath = '/dashboard';
    if (targetTab === 'landing' || targetTab === '') {
      targetTab = 'landing';
      targetPath = '/';
    }

    // Mandatory Authentication Guard:
    // If not logged in and destination is private, redirect to login and preserve destination
    const activeStoredToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token')) : null);
    const isPublic = PUBLIC_PAGES.includes(targetTab);

    if (!isPublic && !user && !activeStoredToken) {
      try {
        sessionStorage.setItem('syllora_intended_destination', targetPath);
      } catch {}
      targetTab = 'login';
      targetPath = '/login';
      showToast('Please sign in to access your dashboard and study materials.', 'info');
    }

    setActiveTabState(targetTab);
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const setActiveTab = (tab: string) => {
    navigateTo(tab);
  };

  // Sync back/forward browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentTab = computeInitialTab();
      setActiveTabState(currentTab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#dc2626', '#f87171', '#ffffff', '#991b1b'],
      });
    } catch {
      // Confetti fallback
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch('/api/user', { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return data.user;
      } else if (res.status === 401) {
        // Session expired or invalid
        localStorage.removeItem('syllora_session_token');
        localStorage.removeItem('studyai_session_token');
        setToken(null);
        setUser(null);
        setSubjects([]);
        setActiveSubject(null);

        // If user is currently on a protected route, preserve destination and route to login
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const currentTab = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
          if (!PUBLIC_PAGES.includes(currentTab)) {
            try {
              sessionStorage.setItem('syllora_intended_destination', currentPath);
            } catch {}
            setActiveTabState('login');
            window.history.pushState(null, '', '/login');
            showToast('Your session has expired. Please sign in again.', 'info');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load user', err);
    } finally {
      setIsRestoringSession(false);
    }
    return null;
  };

  const [subjectToRemove, setSubjectToRemove] = useState<Subject | null>(null);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  const login = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      if (data.token) {
        localStorage.setItem('syllora_session_token', data.token);
        localStorage.setItem('studyai_session_token', data.token);
        setToken(data.token);
      }
      setUser(data.user);
      setAuthEmailForVerification(email);

      // Immediately restore previously saved subjects and study progress from database
      await refreshSubjects();

      // Preserve requested destination if user was redirected from a protected route
      let destination = '/dashboard';
      try {
        const intended = sessionStorage.getItem('syllora_intended_destination');
        if (intended && !PUBLIC_PAGES.includes(intended.replace(/^\//, ''))) {
          destination = intended;
          sessionStorage.removeItem('syllora_intended_destination');
        }
      } catch {}

      navigateTo(destination);
      showToast(`Welcome back to Syllora AI, ${data.user.name}!`, 'success');
      triggerConfetti();
      return { success: true };
    } catch {
      return { success: false, error: 'Network failure: Unable to reach authentication service' };
    }
  };

  const register = async (
    formData: any
  ): Promise<{
    success: boolean;
    error?: string;
    details?: string[];
    requiresEmailVerification?: boolean;
    verificationCode?: string;
  }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed', details: data.details };
      }

      if (data.token) {
        localStorage.setItem('syllora_session_token', data.token);
        localStorage.setItem('studyai_session_token', data.token);
        setToken(data.token);
      }
      setUser(data.user);
      setAuthEmailForVerification(formData.email);

      // Explicitly persist and synchronize sanitized mobile number & profile to Supabase 'profiles' table
      try {
        await syncProfile({
          phoneCountryCode: formData.phoneCountryCode,
          phoneNumber: formData.phoneNumber,
          phone: formData.phone,
          college: formData.college,
          course: formData.course,
          branch: formData.branch,
          year: formData.year,
          semester: formData.semester,
          preferredLanguage: formData.preferredLanguage,
        });
      } catch (err) {
        console.warn('Async profile sync notice:', err);
      }

      // Restore subjects for user
      await refreshSubjects();

      // Preserve requested destination
      let destination = '/dashboard';
      try {
        const intended = sessionStorage.getItem('syllora_intended_destination');
        if (intended && !PUBLIC_PAGES.includes(intended.replace(/^\//, ''))) {
          destination = intended;
          sessionStorage.removeItem('syllora_intended_destination');
        }
      } catch {}

      navigateTo(destination);
      showToast(`Account created successfully! Welcome to Syllora AI, ${data.user.name}!`, 'success');
      triggerConfetti();
      return { success: true, requiresEmailVerification: false };
    } catch {
      return { success: false, error: 'Network failure: Unable to communicate with server' };
    }
  };

  const syncProfile = async (profileData?: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/user/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData || {}),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
      return { success: !!data.success };
    } catch {
      return { success: false, error: 'Unable to communicate with profile sync service' };
    }
  };

  const loginWithGoogle = async (payload: {
    credential?: string;
    profile?: any;
  }): Promise<{ success: boolean; error?: string; requiresOnboarding?: boolean }> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Google authentication failure' };
      }

      if (data.token) {
        localStorage.setItem('syllora_session_token', data.token);
        localStorage.setItem('studyai_session_token', data.token);
        setToken(data.token);
      }
      setUser(data.user);

      if (data.requiresOnboarding) {
        navigateTo('/onboarding');
        showToast('Google account verified! Please provide your mobile number and curriculum.', 'info');
        return { success: true, requiresOnboarding: true };
      }

      let destination = '/dashboard';
      try {
        const intended = sessionStorage.getItem('syllora_intended_destination');
        if (intended && !PUBLIC_PAGES.includes(intended.replace(/^\//, ''))) {
          destination = intended;
          sessionStorage.removeItem('syllora_intended_destination');
        }
      } catch {}

      navigateTo(destination);
      showToast(`Welcome back to Syllora AI, ${data.user.name}!`, 'success');
      triggerConfetti();
      return { success: true, requiresOnboarding: false };
    } catch {
      return { success: false, error: 'Network failure: Unable to connect to Google authentication server' };
    }
  };

  const completeOnboarding = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      const res = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to update academic profile' };
      }

      setUser(resData.user);
      navigateTo('/dashboard');
      showToast('Profile completed! Welcome to your Syllora AI workspace.', 'success');
      triggerConfetti();
      return { success: true };
    } catch {
      return { success: false, error: 'Network failure' };
    }
  };

  const forgotPassword = async (
    email: string
  ): Promise<{ success: boolean; message: string; devResetToken?: string | null; error?: string }> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: '', error: data.error || 'Failed to send reset link' };
      }

      if (data.devResetToken) {
        setResetTokenForView(data.devResetToken);
      }

      return {
        success: true,
        message: data.message || 'Password reset instructions have been sent to your email.',
        devResetToken: data.devResetToken,
      };
    } catch {
      return { success: false, message: '', error: 'Network failure: Unable to reach reset service' };
    }
  };

  const resetPassword = async (
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to reset password' };
      }

      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Network failure' };
    }
  };

  const verifyEmail = async (
    code: string,
    email?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const activeToken = token || localStorage.getItem('studyai_session_token');
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ code, email: email || authEmailForVerification }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid verification code' };
      }

      if (data.user) {
        setUser(data.user);
      }
      showToast('Email verified successfully! 🎉', 'success');
      triggerConfetti();
      navigateTo('/dashboard');
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Network failure' };
    }
  };

  const resendVerification = async (
    email?: string
  ): Promise<{ success: boolean; message?: string; error?: string; devVerificationCode?: string }> => {
    try {
      const activeToken = token || localStorage.getItem('studyai_session_token');
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ email: email || authEmailForVerification }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to resend code' };
      }

      showToast('Verification code resent to your email.', 'info');
      return {
        success: true,
        message: data.message,
        devVerificationCode: data.devVerificationCode,
      };
    } catch {
      return { success: false, error: 'Network failure' };
    }
  };

  const logout = async () => {
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      if (activeToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${activeToken}` },
        });
      }
    } catch {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem('syllora_session_token');
      localStorage.removeItem('studyai_session_token');
      try {
        sessionStorage.removeItem('syllora_intended_destination');
      } catch {}
      setToken(null);
      setUser(null);
      setSubjects([]);
      setActiveSubject(null);
      showToast('Logged out successfully.', 'info');
      navigateTo('/login');
    }
  };

  const refreshSubjects = async () => {
    setIsLoadingSubjects(true);
    setSubjectsError(null);
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      if (!activeToken) {
        setSubjects([]);
        setActiveSubject(null);
        return;
      }

      const res = await fetch('/api/subjects', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allSubjects: Subject[] = data.subjects || [];
        setSubjects(allSubjects);

        if (allSubjects.length > 0) {
          if (activeSubject) {
            const foundActive = allSubjects.find((s) => s.id === activeSubject.id);
            if (foundActive) {
              setActiveSubject(foundActive);
            } else {
              // Active subject was deleted or not found: select first non-archived or first
              const fallback = allSubjects.find((s) => !s.archived) || allSubjects[0];
              setActiveSubject(fallback);
            }
          } else {
            const firstActive = allSubjects.find((s) => !s.archived) || allSubjects[0];
            setActiveSubject(firstActive);
          }
        } else {
          setActiveSubject(null);
        }
      } else if (res.status === 401) {
        setSubjects([]);
        setActiveSubject(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setSubjectsError(errData.error || 'Failed to load your subjects from database.');
      }
    } catch (err: any) {
      console.error('Failed to load subjects', err);
      setSubjectsError('Database connection issue: Unable to load saved subjects.');
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const retrySubjectAnalysis = async (
    subjectId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      showToast('Retrying AI curriculum analysis on saved syllabus...', 'info');
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      const res = await fetch(`/api/subjects/${subjectId}/retry-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshSubjects();
        if (data.subject) {
          setActiveSubject(data.subject);
        }
        showToast('Curriculum analysis completed successfully! 🎉', 'success');
        triggerConfetti();
        return { success: true, message: 'Analysis completed' };
      } else {
        showToast(data.error || 'AI analysis retry interrupted. Syllabus remains safely preserved.', 'error');
        await refreshSubjects();
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      showToast('Network error while retrying AI analysis.', 'error');
      return { success: false, error: err.message };
    }
  };

  const removeSubject = async (
    subjectId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Immediately detach from local active state if deleted
        if (activeSubject?.id === subjectId) {
          const remaining = subjects.filter((s) => s.id !== subjectId);
          setActiveSubject(remaining.find((s) => !s.archived) || remaining[0] || null);
        }
        await refreshSubjects();
        await refreshUser();
        showToast('Subject removed successfully.', 'success');
        return { success: true, message: data.message };
      } else {
        return {
          success: false,
          error: data.error || 'Unable to remove this subject right now.',
        };
      }
    } catch (err: any) {
      console.error('Failed to remove subject', err);
      return {
        success: false,
        error: 'The connection was interrupted. Your subject has not been removed.',
      };
    }
  };

  const archiveSubject = async (subjectId: string, archived?: boolean): Promise<boolean> => {
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      const res = await fetch(`/api/subjects/${subjectId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ archived }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || (data.archived ? 'Subject archived' : 'Subject restored'), 'info');
        await refreshSubjects();
        return true;
      }
    } catch (err) {
      console.error('Failed to update archive status', err);
      showToast('Failed to update archive status', 'error');
    }
    return false;
  };

  const editSubject = async (subjectId: string, updates: Partial<Subject>): Promise<boolean> => {
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Subject details updated.', 'success');
        await refreshSubjects();
        return true;
      }
    } catch (err) {
      console.error('Failed to edit subject', err);
      showToast('Failed to save subject changes', 'error');
    }
    return false;
  };

  const toggleTopicCompleted = async (topicId: string): Promise<boolean> => {
    try {
      const activeToken = token || localStorage.getItem('syllora_session_token') || localStorage.getItem('studyai_session_token');
      const res = await fetch(`/api/topics/${topicId}/toggle`, {
        method: 'POST',
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.completed) {
          showToast(`Marked "${data.topicName}" as completed! (+10 XP) 🎉`, 'success');
          triggerConfetti();
        } else {
          showToast(`Marked "${data.topicName}" as in-progress`, 'info');
        }
        await refreshSubjects();
        if (data.user) {
          setUser(data.user);
        }
        return data.completed;
      }
    } catch (err) {
      console.error('Toggle error', err);
      showToast('Unable to update topic progress', 'error');
    }
    return false;
  };

  const openSyllabusFlow = () => {
    setActiveTab('add-syllabus');
  };

  useEffect(() => {
    refreshUser();
    refreshSubjects();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        subjects,
        activeSubject,
        setActiveSubject,
        activeTab,
        setActiveTab,
        navigateTo,
        selectedTopicId,
        setSelectedTopicId,
        selectedUnitId,
        setSelectedUnitId,
        refreshUser,
        refreshSubjects,
        removeSubject,
        archiveSubject,
        editSubject,
        subjectToRemove,
        setSubjectToRemove,
        subjectToEdit,
        setSubjectToEdit,
        toggleTopicCompleted,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        isAddSyllabusModalOpen,
        setIsAddSyllabusModalOpen,
        toast,
        showToast,
        triggerConfetti,
        login,
        register,
        loginWithGoogle,
        completeOnboarding,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        logout,
        openSyllabusFlow,
        authEmailForVerification,
        setAuthEmailForVerification,
        resetTokenForView,
        setResetTokenForView,
        isRestoringSession,
        isLoadingSubjects,
        subjectsError,
        retrySubjectAnalysis,
        syncProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
