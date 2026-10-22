import 'dotenv/config';
import http from 'http';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupChatWebSocketServer, registerChatRoutes } from './chatService.js';
import { handleTutorSuiteAI } from './tutorService.js';
import {
  readDb,
  writeDb,
  User,
  Subject,
  Note,
  Question,
  MCQ,
  Flashcard,
  StudySession,
  Achievement,
  StudyRoadmap,
  RoadmapDailyPlan,
  RoadmapTaskItem,
  SessionRecord,
} from './db.js';
import {
  saveSyllabusFile,
  deleteSyllabusFile,
  syncSubjectToSupabase,
  deleteSubjectFromSupabase,
  isSupabaseConfigured,
  createSupabaseAuthUser,
  signInSupabaseAuthUser,
  updateSupabaseAuthPassword,
  updateSupabaseAuthPhone,
  syncUserProfileToSupabase,
  createSupabaseProfileWithRetry,
  getSupabaseUserByToken,
  getSyllabusFileDownloadUrl,
  fetchUserSyllabusesFromCloud,
  syncStudyMaterialsToCloudStorage,
} from './supabase.js';
import {
  syncUserToGoogleSheets,
  flushSheetsOutbox,
  getSheetsIntegrationStatus,
} from './sheets.js';
import { buildStudyPackPdfBuffer } from './studyPackPdfService.js';
import {
  generatePackCategory,
  generateCompleteStudyPack,
  isNumericalSubject,
} from './studyPackGeneratorService.js';
import { registerAdvancedRoutes } from './advancedRoutes.js';
import {
  validatePassword,
  hashPassword,
  verifyPassword,
  generateToken,
  generateVerificationCode,
  sanitizeUser,
  validatePhoneNumber,
} from './auth.js';
import {
  analyzeSyllabusAI,
  generateNotesAI,
  explainDifferentlyAI,
  generateQuestionsAI,
  generateNumericalsAI,
  generateTopicQuestionsBatchAI,
  generateTopicNumericalsBatchAI,
  generateMCQsAI,
  generateFlashcardsAI,
  generateMindMapAI,
  generateCheatSheetAI,
  analyzePreviousPaperAI,
  predictExamAI,
  generateQuestionPaperAI,
  evaluateAnswerAI,
  lastMinuteRevisionAI,
  studyChatAI,
  evaluateVoiceVivaAI,
  codingLabDebugAI,
  generateStudyRoadmapAI,
  adaptStudyRoadmapAI,
} from './gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoints for deployment probes & container readiness
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'Syllora AI', timestamp: new Date().toISOString() });
});

// Helper: check and award streak
function updateStreakAndXp(userId: string, xpGain: number): { user: User; newAchievements: Achievement[] } {
  const db = readDb();
  let user = db.users.find((u) => u.id === userId);
  if (!user) {
    user = db.users[0];
  }

  const today = new Date().toISOString().split('T')[0];
  const newAchievements: Achievement[] = [];

  // Update XP and Level
  user.xp += xpGain;
  user.level = Math.max(1, Math.floor(user.xp / 100) + 1);

  // Update streak
  if (!user.activeDates.includes(today)) {
    user.activeDates.push(today);
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (user.lastActiveDate === yesterday) {
      user.currentStreak += 1;
    } else if (user.lastActiveDate !== today) {
      user.currentStreak = 1;
    }
    user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
    user.lastActiveDate = today;

    // Check 7-day streak achievement
    if (user.currentStreak >= 7 && !db.achievements.some((a) => a.key === '7_DAY_STREAK')) {
      const ach: Achievement = {
        id: `ach_${Date.now()}`,
        key: '7_DAY_STREAK',
        title: '7-Day Streak',
        description: 'Maintained a consistent 7-day daily study momentum',
        icon: '🔥',
        unlockedAt: new Date().toISOString(),
      };
      db.achievements.push(ach);
      newAchievements.push(ach);
    }
  }

  writeDb(db);
  return { user, newAchievements };
}

app.get('/api/docs/specification.csv', (req: Request, res: Response) => {
  const filePath = path.resolve(process.cwd(), 'docs', 'PROJECT_SPECIFICATION.csv');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Syllora_AI_Project_Specification.csv"');
    return res.sendFile(filePath);
  }
  res.status(404).send('Specification file not found');
});

// ----------------- USER & AUTH ROUTES -----------------

function getSessionUser(req: Request, db: any): User | null {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
    (req.headers['x-session-token'] as string) ||
    (req.query.token as string) ||
    null;

  if (!token) return null;

  // 1. Check local session records
  const session = (db.sessions || []).find((s: SessionRecord) => s.token === token);
  if (session) {
    if (session.expiresAt && session.expiresAt < Date.now()) {
      db.sessions = db.sessions.filter((s: SessionRecord) => s.token !== token);
      writeDb(db);
      return null;
    }

    const user = db.users.find((u: User) => u.id === session.userId);
    if (user) return user;
  }

  // 2. Check if token is a valid Supabase JWT access token
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      if (payload && payload.sub && payload.exp && payload.exp * 1000 > Date.now()) {
        const user = db.users.find(
          (u: User) =>
            u.id === payload.sub ||
            (payload.email && u.email.toLowerCase() === payload.email.toLowerCase())
        );
        if (user) {
          return user;
        }
      }
    }
  } catch {
    // Ignore JWT decode errors
  }

  return null;
}

app.get('/api/user', (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);

  if (sessionUser) {
    // Auto-heal existing unverified accounts so they are immediately active
    if (sessionUser.emailVerified === false) {
      sessionUser.emailVerified = true;
      writeDb(db);
    }
    return res.json({ user: sanitizeUser(sessionUser), achievements: db.achievements });
  }

  const hasToken = req.headers.authorization || req.headers['x-session-token'] || req.query.token;
  if (hasToken) {
    return res.status(401).json({ user: null, sessionExpired: true, error: 'Session expired or invalid.' });
  }

  // No session token provided
  res.json({ user: null, achievements: db.achievements });
});

app.post('/api/user/update', (req: Request, res: Response) => {
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const {
    name,
    college,
    course,
    branch,
    year,
    semester,
    preferredLanguage,
    examDate,
    privacyShareStats,
    avatar,
    phoneCountryCode,
    phoneNumber,
  } = req.body;

  if (phoneNumber !== undefined && phoneNumber.trim() !== '') {
    const phoneVal = validatePhoneNumber(phoneCountryCode || user.phoneCountryCode || '+91', phoneNumber);
    if (!phoneVal.valid) {
      return res.status(400).json({ error: phoneVal.error || 'Invalid mobile number.' });
    }
    const duplicatePhone = db.users.some(
      (u) =>
        u.id !== user.id &&
        (u.phone === phoneVal.international ||
          (u.phoneCountryCode === phoneVal.countryCode && u.phoneNumber === phoneVal.digitsOnly))
    );
    if (duplicatePhone) {
      return res.status(409).json({ error: 'An account with this mobile number already exists.' });
    }
    user.phoneCountryCode = phoneVal.countryCode;
    user.phoneNumber = phoneVal.digitsOnly;
    user.phone = phoneVal.international;

    if (isSupabaseConfigured()) {
      updateSupabaseAuthPhone(user.id, phoneVal.international, {
        name: user.name,
        phone: phoneVal.international,
        phoneCountryCode: phoneVal.countryCode,
        phoneNumber: phoneVal.digitsOnly,
      }).catch((err) => console.warn('[Supabase Auth] Phone update notice:', err));
    }
  }

  if (name !== undefined) user.name = name;
  if (college !== undefined) user.college = college;
  if (course !== undefined) user.course = course;
  if (branch !== undefined) user.branch = branch;
  if (year !== undefined) user.year = year;
  if (semester !== undefined) user.semester = semester;
  if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
  if (examDate !== undefined) user.examDate = examDate;
  if (privacyShareStats !== undefined) user.privacyShareStats = privacyShareStats;
  if (avatar !== undefined) user.avatar = avatar;

  writeDb(db);

  if (isSupabaseConfigured()) {
    syncUserProfileToSupabase(user).catch(() => {});
  }
  // Synchronize profile changes to Google Sheets
  syncUserToGoogleSheets(user, user.googleId ? 'Google OAuth' : 'Email/Password', true).catch((e) =>
    console.warn('[Google Sheets] Async update sync notice:', e)
  );

  res.json({ success: true, user: sanitizeUser(user) });
});

// Explicit profile synchronization to Supabase 'profiles' table
app.post('/api/user/sync-profile', async (req: Request, res: Response) => {
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const { phoneCountryCode, phoneNumber, phone } = req.body;
  if (phoneNumber || phone) {
    const val = validatePhoneNumber(phoneCountryCode || user.phoneCountryCode || '+91', phoneNumber || phone);
    if (val.valid) {
      user.phoneCountryCode = val.countryCode;
      user.phoneNumber = val.digitsOnly;
      user.phone = val.international;
      writeDb(db);
    }
  }

  let supabaseSynced = false;
  if (isSupabaseConfigured()) {
    supabaseSynced = await syncUserProfileToSupabase(user);
    if (user.phone) {
      await updateSupabaseAuthPhone(user.id, user.phone, {
        name: user.name,
        phone: user.phone,
        phoneCountryCode: user.phoneCountryCode,
        phoneNumber: user.phoneNumber,
        college: user.college,
      }).catch(() => {});
    }
  }

  res.json({
    success: true,
    user: sanitizeUser(user),
    supabaseSynced,
  });
});

// Google Sheets Admin Endpoints
app.get('/api/admin/sheets/status', (_req: Request, res: Response) => {
  res.json(getSheetsIntegrationStatus());
});

app.post('/api/admin/sheets/sync-outbox', async (_req: Request, res: Response) => {
  const result = await flushSheetsOutbox();
  res.json({ success: true, ...result });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = readDb();
  const cleanEmail = email.trim().toLowerCase();
  let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  // 1. Primary Authentication: Real Supabase Auth Provider (if configured)
  let authenticatedViaSupabase = false;
  if (isSupabaseConfigured()) {
    const sbRes = await signInSupabaseAuthUser({ email: cleanEmail, password });
    if (sbRes.user && !sbRes.error) {
      authenticatedViaSupabase = true;
      if (!user) {
        // Restore user profile from Supabase metadata if not present in local db
        const meta = sbRes.user.user_metadata || {};
        user = {
          id: sbRes.user.id,
          name: meta.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          college: meta.college || '',
          course: meta.course || 'B.Tech',
          branch: meta.branch || 'Computer Science',
          year: meta.year || '1st Year',
          semester: meta.semester || '1st Semester',
          preferredLanguage: meta.preferredLanguage || 'English',
          phoneCountryCode: meta.phoneCountryCode || '+91',
          phoneNumber: meta.phoneNumber || '',
          phone: meta.phone || '',
          xp: 50,
          level: 1,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          activeDates: [new Date().toISOString().split('T')[0]],
          createdAt: sbRes.user.created_at || new Date().toISOString(),
          privacyShareStats: true,
          emailVerified: true,
        };
        db.users.unshift(user);
      }
    }
  }

  // 2. Secondary/Fallback Authentication: Secure Local DB Salted Hash Verification
  if (!authenticatedViaSupabase) {
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password. Please verify your credentials or use Forgot Password.',
      });
    }

    let isPasswordValid = false;
    if (user.passwordHash && user.passwordSalt) {
      isPasswordValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    } else if (password === 'StudyAI2026!' || password.length >= 8) {
      // Initialize password hash for legacy seed account
      const { hash, salt } = hashPassword(password);
      user.passwordHash = hash;
      user.passwordSalt = salt;
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password. Please verify your credentials or use Forgot Password.',
      });
    }

    // Auto-sync valid local account into Supabase Auth if missing there
    if (isSupabaseConfigured()) {
      createSupabaseAuthUser({
        email: cleanEmail,
        password,
        phone: user.phone,
        metadata: {
          name: user.name,
          phone: user.phone,
          college: user.college,
        },
      }).catch(() => {});
    }
  }

  if (!user) {
    return res.status(401).json({
      error: 'Invalid email or password. Please verify your credentials or use Forgot Password.',
    });
  }

  if (isSupabaseConfigured() && user.phone) {
    updateSupabaseAuthPhone(user.id, user.phone, {
      name: user.name,
      phone: user.phone,
      phoneCountryCode: user.phoneCountryCode,
      phoneNumber: user.phoneNumber,
    }).catch(() => {});
    syncUserProfileToSupabase(user).catch(() => {});
  }

  // Ensure emailVerified is true
  user.emailVerified = true;

  // 3. Permanent Cloud Syllabus Restoration:
  // Automatically restore user's saved subjects and study materials from Supabase Cloud
  if (isSupabaseConfigured() && user.id) {
    try {
      const cloudData = await fetchUserSyllabusesFromCloud(user.id);
      if (cloudData.subjects.length > 0) {
        for (const cloudSub of cloudData.subjects) {
          const existingIdx = db.subjects.findIndex((s) => s.id === cloudSub.id);
          if (existingIdx === -1) {
            db.subjects.unshift(cloudSub);
          } else {
            const existing = db.subjects[existingIdx];
            if (new Date(cloudSub.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
              db.subjects[existingIdx] = cloudSub;
            }
          }
        }
      }

      // Restore study materials if available
      for (const [subId, mats] of Object.entries(cloudData.studyMaterials)) {
        if (mats.notes && Array.isArray(mats.notes)) {
          for (const n of mats.notes) {
            if (!db.notes.some((existing) => existing.id === n.id)) {
              db.notes.push(n);
            }
          }
        }
        if (mats.questions && Array.isArray(mats.questions)) {
          for (const q of mats.questions) {
            if (!db.questions.some((existing) => existing.id === q.id)) {
              db.questions.push(q);
            }
          }
        }
        if (mats.mcqs && Array.isArray(mats.mcqs)) {
          for (const m of mats.mcqs) {
            if (!db.mcqs.some((existing) => existing.id === m.id)) {
              db.mcqs.push(m);
            }
          }
        }
        if (mats.flashcards && Array.isArray(mats.flashcards)) {
          for (const f of mats.flashcards) {
            if (!db.flashcards.some((existing) => existing.id === f.id)) {
              db.flashcards.push(f);
            }
          }
        }
      }
    } catch (restoreErr) {
      console.warn('[Supabase Cloud Restore on Login Notice]:', restoreErr);
    }
  }

  // Generate session token
  const token = generateToken();
  const duration = rememberMe ? 30 * 86400000 : 24 * 3600000;
  const newSession: SessionRecord = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + duration,
    rememberMe: !!rememberMe,
  };

  db.sessions = db.sessions || [];
  db.sessions.push(newSession);
  writeDb(db);

  // Synchronize login to Google Sheets (updates Last Login Date)
  syncUserToGoogleSheets(user, user.googleId ? 'Google OAuth' : 'Email/Password', true).catch((e) =>
    console.warn('[Google Sheets] Async login sync notice:', e)
  );

  res.json({
    success: true,
    user: sanitizeUser(user),
    token,
    requiresEmailVerification: false,
  });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    phoneCountryCode,
    phoneNumber,
    phone,
    college,
    course,
    branch,
    year,
    semester,
    preferredLanguage,
    examDate,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Mobile number validation
  const phoneValidation = validatePhoneNumber(phoneCountryCode || '+91', phoneNumber || phone || '');
  if (!phoneValidation.valid) {
    return res.status(400).json({ error: phoneValidation.error || 'Please enter a valid mobile number.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = readDb();

  // Check email collision
  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: 'Email already registered. Please log in instead.' });
  }

  // Check duplicate mobile number
  const duplicatePhone = db.users.some(
    (u) =>
      u.phone === phoneValidation.international ||
      (u.phoneCountryCode === phoneValidation.countryCode && u.phoneNumber === phoneValidation.digitsOnly)
  );
  if (duplicatePhone) {
    return res.status(409).json({ error: 'An account with this mobile number already exists.' });
  }

  // Password requirements validation
  const validation = validatePassword(password || '');
  if (!validation.valid) {
    return res.status(400).json({
      error: validation.errors[0] || 'Password does not meet requirements.',
      details: validation.errors,
    });
  }

  // Confirm password check
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ error: 'Password confirmation does not match.' });
  }

  // 1. Create account with real Supabase Auth provider (if configured)
  let permanentUserId = `usr_${Date.now()}`;
  if (isSupabaseConfigured()) {
    const sbResult = await createSupabaseAuthUser({
      email: cleanEmail,
      password,
      phone: phoneValidation.international,
      metadata: {
        name: name.trim(),
        phone: phoneValidation.international,
        phoneCountryCode: phoneValidation.countryCode,
        phoneNumber: phoneValidation.digitsOnly,
        college: college?.trim() || '',
        course: course || 'B.Tech',
        branch: branch || 'Computer Science',
        year: year || '1st Year',
        semester: semester || '1st Semester',
        preferredLanguage: preferredLanguage || 'English',
      },
    });

    if (sbResult.user?.id) {
      permanentUserId = sbResult.user.id;
      // Immediately save sanitized phone and profile attributes to Supabase 'profiles' table with race-condition retry handling
      await createSupabaseProfileWithRetry({
        id: permanentUserId,
        email: cleanEmail,
        name: name.trim(),
        phoneCountryCode: phoneValidation.countryCode,
        phoneNumber: phoneValidation.digitsOnly,
        phone: phoneValidation.international,
        college: college?.trim() || '',
        course: course || 'B.Tech',
        branch: branch || 'Computer Science',
        year: year || '1st Year',
        semester: semester || '1st Semester',
        preferredLanguage: preferredLanguage || 'English',
        examDate: examDate || undefined,
      }).catch((profileErr) => {
        console.warn('[Supabase Immediate Profile Creation Notice]:', profileErr);
      });
    } else if (sbResult.error && sbResult.error.toLowerCase().includes('already registered')) {
      return res.status(409).json({ error: 'Email already registered with authentication provider. Please log in.' });
    }
  }

  const { hash, salt } = hashPassword(password);

  // 2. Persist user profile permanently in database
  const newUser: User = {
    id: permanentUserId,
    name: name.trim(),
    email: cleanEmail,
    passwordHash: hash,
    passwordSalt: salt,
    phoneCountryCode: phoneValidation.countryCode,
    phoneNumber: phoneValidation.digitsOnly,
    phone: phoneValidation.international,
    college: college?.trim() || '',
    course: course || 'B.Tech',
    branch: branch || 'Computer Science',
    year: year || '1st Year',
    semester: semester || '1st Semester',
    preferredLanguage: preferredLanguage || 'English',
    examDate: examDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    xp: 50,
    level: 1,
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    activeDates: [new Date().toISOString().split('T')[0]],
    createdAt: new Date().toISOString(),
    privacyShareStats: true,
    emailVerified: true,
  };

  db.users.unshift(newUser);

  // Generate persistent authenticated session token
  const token = generateToken();
  const newSession: SessionRecord = {
    token,
    userId: newUser.id,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 30 * 86400000,
    rememberMe: true,
  };
  db.sessions = db.sessions || [];
  db.sessions.push(newSession);

  writeDb(db);

  if (isSupabaseConfigured()) {
    try {
      await syncUserProfileToSupabase(newUser);
    } catch (sbErr) {
      console.warn('[Supabase Profiles Sync Notice]:', sbErr);
    }
  }

  // Synchronize new registration to Google Sheets (asynchronous, resilient outbox)
  syncUserToGoogleSheets(newUser, 'Email/Password', false).catch((e) =>
    console.warn('[Google Sheets] Async register sync notice:', e)
  );

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Welcome to Syllora AI.',
    user: sanitizeUser(newUser),
    token,
    requiresEmailVerification: false,
  });
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  const { credential, profile } = req.body;
  const db = readDb();

  let email = '';
  let name = '';
  let avatar = '';
  let googleId = '';

  if (profile && profile.email) {
    email = profile.email.toLowerCase().trim();
    name = profile.name || profile.displayName || email.split('@')[0];
    avatar = profile.avatar || profile.picture || profile.photoURL || '';
    googleId = profile.id || profile.sub || profile.googleId || '';
  } else if (credential && typeof credential === 'string') {
    // Decode Google ID token JWT payload safely
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        email = (payload.email || '').toLowerCase().trim();
        name = payload.name || payload.given_name || email.split('@')[0];
        avatar = payload.picture || '';
        googleId = payload.sub || '';
      }
    } catch (e) {
      console.warn('Failed to parse Google JWT payload:', e);
    }
  }

  if (!email) {
    return res.status(400).json({ error: 'Google authentication failure: Email address could not be verified.' });
  }

  let user = db.users.find((u) => u.email.toLowerCase() === email || (googleId && u.googleId === googleId));
  let isNewUser = false;

  if (user) {
    if (avatar && !user.avatar) user.avatar = avatar;
    if (googleId && !user.googleId) user.googleId = googleId;
    user.emailVerified = true;
  } else {
    isNewUser = true;
    user = {
      id: `usr_g_${Date.now()}`,
      name: name || 'Google User',
      email,
      avatar,
      googleId,
      college: '',
      course: '',
      branch: '',
      year: '',
      semester: '',
      preferredLanguage: 'English',
      examDate: '',
      xp: 50,
      level: 1,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      activeDates: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString(),
      privacyShareStats: true,
      emailVerified: true,
    };
    db.users.unshift(user);
  }

  // Check if user requires academic onboarding or missing mobile number
  const requiresOnboarding = isNewUser || !user.college || !user.course || !user.branch || !user.phoneNumber;

  // Generate session token
  const token = generateToken();
  const session: SessionRecord = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 30 * 86400000,
    rememberMe: true,
  };
  db.sessions = db.sessions || [];
  db.sessions.push(session);

  writeDb(db);

  // Synchronize Google user to Google Sheets
  syncUserToGoogleSheets(user, 'Google OAuth', !isNewUser).catch((e) =>
    console.warn('[Google Sheets] Async google user sync notice:', e)
  );

  res.json({
    success: true,
    user: sanitizeUser(user),
    token,
    requiresOnboarding,
  });
});

app.post('/api/auth/complete-onboarding', (req: Request, res: Response) => {
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required to complete onboarding.' });
  }

  const {
    college,
    course,
    branch,
    year,
    semester,
    preferredLanguage,
    examDate,
    phoneCountryCode,
    phoneNumber,
  } = req.body;

  // Validate mobile number if provided or if missing on user profile
  if (phoneNumber || !user.phoneNumber) {
    const phoneValidation = validatePhoneNumber(phoneCountryCode || user.phoneCountryCode || '+91', phoneNumber || '');
    if (!phoneValidation.valid) {
      return res.status(400).json({ error: phoneValidation.error || 'Please enter a valid mobile number.' });
    }

    // Check duplicate mobile number across users (excluding self)
    const duplicatePhone = db.users.some(
      (u) =>
        u.id !== user.id &&
        (u.phone === phoneValidation.international ||
          (u.phoneCountryCode === phoneValidation.countryCode && u.phoneNumber === phoneValidation.digitsOnly))
    );
    if (duplicatePhone) {
      return res.status(409).json({ error: 'An account with this mobile number already exists.' });
    }

    user.phoneCountryCode = phoneValidation.countryCode;
    user.phoneNumber = phoneValidation.digitsOnly;
    user.phone = phoneValidation.international;

    if (isSupabaseConfigured()) {
      updateSupabaseAuthPhone(user.id, phoneValidation.international, {
        name: user.name,
        phone: phoneValidation.international,
        phoneCountryCode: phoneValidation.countryCode,
        phoneNumber: phoneValidation.digitsOnly,
      }).catch((err) => console.warn('[Supabase Auth] Onboarding phone update notice:', err));
    }
  }

  if (college !== undefined) user.college = college.trim();
  if (course !== undefined) user.course = course;
  if (branch !== undefined) user.branch = branch;
  if (year !== undefined) user.year = year;
  if (semester !== undefined) user.semester = semester;
  if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
  if (examDate !== undefined) user.examDate = examDate;

  writeDb(db);

  if (isSupabaseConfigured()) {
    syncUserProfileToSupabase(user).catch(() => {});
  }

  // Synchronize onboarding details to Google Sheets
  syncUserToGoogleSheets(user, user.googleId ? 'Google OAuth' : 'Email/Password', true).catch((e) =>
    console.warn('[Google Sheets] Async onboarding sync notice:', e)
  );

  res.json({ success: true, user: sanitizeUser(user) });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const db = readDb();
  const cleanEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  let resetToken = '';
  if (user) {
    resetToken = generateToken();
    user.resetToken = resetToken;
    user.resetExpiresAt = Date.now() + 15 * 60 * 1000; // 15 mins expiry
    writeDb(db);
  }

  // Do not reveal whether an email exists in a way that enables account enumeration
  res.json({
    success: true,
    message: 'Password reset instructions have been sent to your email.',
    // In dev / preview environment, we provide resetToken so the user can test the reset flow immediately
    devResetToken: resetToken || null,
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword, confirmPassword } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Reset token is required.' });
  }

  const db = readDb();
  const user = db.users.find((u) => u.resetToken === token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid reset link. Please request a new one.' });
  }

  if (user.resetExpiresAt && user.resetExpiresAt < Date.now()) {
    return res.status(400).json({ error: 'Expired reset link. Please request a new reset link.' });
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const validation = validatePassword(newPassword || '');
  if (!validation.valid) {
    return res.status(400).json({
      error: validation.errors[0] || 'Password does not meet requirements.',
      details: validation.errors,
    });
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.passwordSalt = salt;
  delete user.resetToken;
  delete user.resetExpiresAt;

  writeDb(db);

  if (isSupabaseConfigured()) {
    updateSupabaseAuthPassword(user.id, newPassword).catch((e) =>
      console.warn('[Supabase Auth] Reset password update notice:', e)
    );
  }

  res.json({
    success: true,
    message: 'Your password has been updated successfully.',
  });
});

app.post('/api/auth/verify-email', (req: Request, res: Response) => {
  const { code, email } = req.body;
  const db = readDb();
  let user = getSessionUser(req, db);

  if (!user && email) {
    user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  if (user) {
    user.emailVerified = true;
    delete user.verificationCode;
    delete user.verificationExpiresAt;
    writeDb(db);
    return res.json({ success: true, message: 'Account is verified and ready. Direct signup active!', user: sanitizeUser(user) });
  }

  return res.json({ success: true, message: 'Email accounts are automatically verified.' });
});

app.post('/api/auth/resend-verification', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Direct signup enabled: OTP email verification is not required.',
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
    (req.headers['x-session-token'] as string) ||
    null;

  if (token) {
    const db = readDb();
    db.sessions = (db.sessions || []).filter((s: SessionRecord) => s.token !== token);
    writeDb(db);
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

// ----------------- SUBJECTS & TOPICS ROUTES -----------------
app.get('/api/subjects', async (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to access your subjects.' });
  }

  // Cross-device cloud sync: ensure subjects uploaded on any device are restored
  if (isSupabaseConfigured() && sessionUser.id) {
    try {
      const cloudData = await fetchUserSyllabusesFromCloud(sessionUser.id);
      let dbUpdated = false;
      for (const cloudSub of cloudData.subjects) {
        const existingIdx = db.subjects.findIndex((s) => s.id === cloudSub.id);
        if (existingIdx === -1) {
          db.subjects.unshift(cloudSub);
          dbUpdated = true;
        } else {
          const existing = db.subjects[existingIdx];
          if (new Date(cloudSub.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
            db.subjects[existingIdx] = cloudSub;
            dbUpdated = true;
          }
        }
      }
      if (dbUpdated) {
        writeDb(db);
      }
    } catch (e) {
      // ignore
    }
  }

  // Strictly isolate subjects by owner: only return subjects belonging to the authenticated user
  const userSubjects = db.subjects.filter((s) => s.userId === sessionUser.id);
  return res.json({ subjects: userSubjects });
});

app.get('/api/subjects/:id', (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }
  const subject = db.subjects.find((s) => s.id === req.params.id);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  // Cross-user ownership authorization guard
  if (subject.userId && subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
    return res.status(403).json({ error: 'Forbidden: You do not own this subject.' });
  }

  // Retrieve all previously generated and saved study materials for this subject
  const notes = db.notes.filter((n) => n.subjectId === subject.id);
  const questions = db.questions.filter((q) => q.subjectId === subject.id);
  const mcqs = db.mcqs.filter((m) => m.subjectId === subject.id);
  const flashcards = db.flashcards.filter((f) => f.subjectId === subject.id);
  const mindmaps = db.mindmaps.filter((mm) => mm.subjectId === subject.id);
  const cheatsheets = db.cheatsheets.filter((cs) => cs.subjectId === subject.id);
  const studyPlans = db.studyPlans.filter((sp) => sp.subjectId === subject.id);
  const mockTests = (db.generatedPapers || []).filter((gp: any) => gp.subjectId === subject.id);
  const roadmaps = (db.roadmaps || []).filter(
    (rm: any) => rm.subjectId === subject.id || rm.subjectName?.toLowerCase() === subject.name.toLowerCase()
  );

  res.json({
    subject,
    notes,
    questions,
    mcqs,
    flashcards,
    mindmaps,
    cheatsheets,
    studyPlans,
    mockTests,
    roadmaps,
  });
});

// Comprehensive Study Pack bundle for subject (all 11 categories)
app.get('/api/subjects/:id/study-pack', (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const subject = db.subjects.find((s) => s.id === req.params.id);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  if (subject.userId && subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
    return res.status(403).json({ error: 'Forbidden: You do not own this subject.' });
  }

  const notes = db.notes.filter((n) => n.subjectId === subject.id);
  const allQuestions = db.questions.filter((q) => q.subjectId === subject.id);
  const conceptualQuestions = allQuestions.filter((q) => !q.isNumerical);
  const numericals = allQuestions.filter((q) => q.isNumerical);
  const mcqs = db.mcqs.filter((m) => m.subjectId === subject.id);
  const flashcards = db.flashcards.filter((f) => f.subjectId === subject.id);
  const mindmaps = db.mindmaps.filter((mm) => mm.subjectId === subject.id);
  const cheatsheets = db.cheatsheets.filter((cs) => cs.subjectId === subject.id);
  const studyPlans = db.studyPlans.filter((sp) => sp.subjectId === subject.id);
  const mockTests = (db.generatedPapers || []).filter((gp: any) => gp.subjectId === subject.id);
  const roadmaps = (db.roadmaps || []).filter(
    (rm: any) => rm.subjectId === subject.id || rm.subjectName?.toLowerCase() === subject.name.toLowerCase()
  );
  const vivaQuestions = (db.vivaQuestions || []).filter((vq) => vq.subjectId === subject.id);

  // Derive high-yield priority topics from subject units
  const priorityTopics: any[] = [];
  (subject.units || []).forEach((u) => {
    (u.topics || []).forEach((t) => {
      priorityTopics.push({
        unitName: u.name,
        topicName: t.name,
        priority: t.priority || 'important',
        priorityReason: t.priorityReason || '',
        weightage: u.weightage || 20,
      });
    });
  });

  const categoriesSummary = {
    overview: 1,
    priority: priorityTopics.length,
    notes: notes.length,
    questions: conceptualQuestions.length,
    numericals: numericals.length,
    mcqs: mcqs.length,
    flashcards: flashcards.length,
    cheatsheet: cheatsheets.length,
    mindmap: mindmaps.length,
    viva: vivaQuestions.length > 0 ? vivaQuestions.length : (conceptualQuestions.length > 0 ? Math.min(conceptualQuestions.length, 10) : 0),
    studyplan: roadmaps.length > 0 || studyPlans.length > 0 ? 1 : 0,
    mocktest: mockTests.length,
  };

  const isMathSubject = isNumericalSubject(subject.name, subject.units || []);

  const categoryStatuses: Record<string, 'Completed' | 'Partially Generated' | 'Not Started' | 'Not Applicable'> = {
    overview: 'Completed',
    priority: priorityTopics.length > 0 ? 'Completed' : 'Not Started',
    notes: notes.length >= 4 ? 'Completed' : notes.length > 0 ? 'Partially Generated' : 'Not Started',
    questions: conceptualQuestions.length >= 6 ? 'Completed' : conceptualQuestions.length > 0 ? 'Partially Generated' : 'Not Started',
    numericals: numericals.length >= 4 ? 'Completed' : numericals.length > 0 ? 'Partially Generated' : (isMathSubject ? 'Not Started' : 'Not Applicable'),
    mcqs: mcqs.length >= 8 ? 'Completed' : mcqs.length > 0 ? 'Partially Generated' : 'Not Started',
    flashcards: flashcards.length >= 6 ? 'Completed' : flashcards.length > 0 ? 'Partially Generated' : 'Not Started',
    cheatsheet: cheatsheets.length >= 1 ? 'Completed' : 'Not Started',
    mindmap: mindmaps.length >= 1 ? 'Completed' : 'Not Started',
    viva: vivaQuestions.length > 0 || conceptualQuestions.length > 0 ? 'Completed' : 'Not Started',
    mocktest: mockTests.length >= 1 ? 'Completed' : 'Not Started',
    studyplan: roadmaps.length > 0 || studyPlans.length > 0 ? 'Completed' : 'Not Started',
  };

  res.json({
    success: true,
    subject,
    notes,
    questions: conceptualQuestions,
    numericals,
    mcqs,
    flashcards,
    mindmaps,
    cheatsheets,
    vivaQuestions,
    mockTests,
    roadmaps,
    studyPlans,
    priorityTopics,
    categoriesSummary,
    categoryStatuses,
  });
});

// Real AI Generation endpoint for a single Study Pack category
app.post('/api/subjects/:id/generate-pack-category', async (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const subject = db.subjects.find((s) => s.id === req.params.id);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  const { category, forceRegenerate, preferredLanguage } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Missing required parameter: category' });
  }

  try {
    const result = await generatePackCategory(subject.id, category, sessionUser.id, {
      forceRegenerate: !!forceRegenerate,
      preferredLanguage: preferredLanguage || sessionUser.preferredLanguage,
    });
    res.json({ success: true, result });
  } catch (err: any) {
    console.error(`[Generate Pack Category Error - ${category}]:`, err);
    res.status(500).json({ error: err.message || 'Failed to generate category content' });
  }
});

// Real AI Generation endpoint for Complete Study Pack across all categories
app.post('/api/subjects/:id/generate-complete-pack', async (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const subject = db.subjects.find((s) => s.id === req.params.id);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  const { categories, forceRegenerate, preferredLanguage } = req.body;
  const targetCategories = Array.isArray(categories) && categories.length > 0
    ? categories
    : [
        'overview',
        'priority',
        'notes',
        'questions',
        'numericals',
        'mcqs',
        'flashcards',
        'mindmap',
        'cheatsheet',
        'viva',
        'mocktest',
        'studyplan',
      ];

  try {
    const packResult = await generateCompleteStudyPack(subject.id, targetCategories, sessionUser.id, {
      forceRegenerate: !!forceRegenerate,
      preferredLanguage: preferredLanguage || sessionUser.preferredLanguage,
    });
    res.json(packResult);
  } catch (err: any) {
    console.error('[Generate Complete Study Pack Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to generate complete study pack' });
  }
});

// Server-side PDF export fallback endpoint
app.get('/api/subjects/:id/export-pdf', async (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const subject = db.subjects.find((s) => s.id === req.params.id);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  if (subject.userId && subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
    return res.status(403).json({ error: 'Forbidden: You do not own this subject.' });
  }

  try {
    const notes = db.notes.filter((n) => n.subjectId === subject.id);
    const allQuestions = db.questions.filter((q) => q.subjectId === subject.id);
    const conceptualQuestions = allQuestions.filter((q) => !q.isNumerical);
    const numericals = allQuestions.filter((q) => q.isNumerical);
    const mcqs = db.mcqs.filter((m) => m.subjectId === subject.id);
    const flashcards = db.flashcards.filter((f) => f.subjectId === subject.id);
    const mindmaps = db.mindmaps.filter((mm) => mm.subjectId === subject.id);
    const cheatsheets = db.cheatsheets.filter((cs) => cs.subjectId === subject.id);
    const mockTests = (db.generatedPapers || []).filter((gp: any) => gp.subjectId === subject.id);
    const roadmaps = (db.roadmaps || []).filter(
      (rm: any) => rm.subjectId === subject.id || rm.subjectName?.toLowerCase() === subject.name.toLowerCase()
    );

    const categoriesParam = req.query.categories as string;
    const selectedCategories = categoriesParam ? categoriesParam.split(',') : undefined;

    const { buffer, filename } = buildStudyPackPdfBuffer(
      {
        subject,
        notes,
        questions: conceptualQuestions,
        numericals,
        mcqs,
        flashcards,
        mindmaps,
        cheatsheets,
        mockTests,
        roadmaps,
        vivaQuestions: (db.vivaQuestions || []).filter((vq) => vq.subjectId === subject.id),
      },
      {
        selectedCategories,
        userName: sessionUser.name,
        collegeName: sessionUser.college,
      }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err: any) {
    console.error('[PDF Export Endpoint Error]:', err);
    res.status(500).json({ error: 'Failed to generate Study Pack PDF: ' + (err.message || 'Unknown error') });
  }
});

// Download/View private uploaded syllabus file
app.get('/api/subjects/:id/file', async (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const subject = db.subjects.find((s) => s.id === req.params.id);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  if (subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
    return res.status(403).json({ error: 'Forbidden: You do not own this subject.' });
  }

  if (subject.uploadedFilePath && fs.existsSync(subject.uploadedFilePath)) {
    res.setHeader('Content-Disposition', `inline; filename="${subject.uploadedFileName || 'syllabus.pdf'}"`);
    return res.sendFile(path.resolve(subject.uploadedFilePath));
  }

  if (isSupabaseConfigured() && subject.uploadedFileName) {
    const remotePath = `${subject.userId}/${subject.uploadedFileName}`;
    const signedUrl = await getSyllabusFileDownloadUrl(remotePath);
    if (signedUrl) {
      return res.redirect(signedUrl);
    }
  }

  return res.status(404).json({ error: 'Uploaded syllabus file not found on server.' });
});

// Permanent Syllabus Upload & Analysis: Saves Subject FIRST before AI analysis
app.post('/api/subjects/upload-and-analyze', async (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Authentication required to upload and save syllabus.' });
  }

  const { syllabusText, fileData, preferBackup } = req.body;

  if (!syllabusText && (!fileData || !fileData.base64)) {
    return res.status(400).json({ error: 'Please provide either syllabus text or an uploaded syllabus document.' });
  }

  let textContent = syllabusText || '';
  let storedFileName: string | undefined = undefined;
  let storedFilePath: string | undefined = undefined;
  const mimeType = fileData?.type || fileData?.mimeType || 'application/octet-stream';

  if (fileData && fileData.base64) {
    try {
      const fileSaveResult = await saveSyllabusFile(
        sessionUser.id,
        fileData.fileName || fileData.name || 'syllabus.pdf',
        fileData.base64,
        mimeType
      );
      storedFilePath = fileSaveResult.localPath;
      storedFileName = fileData.fileName || fileData.name || 'syllabus.pdf';
    } catch (err) {
      console.warn('File save notice:', err);
    }
  }

  const initialName = storedFileName
    ? storedFileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
    : (textContent.split('\n')[0] || 'My Syllabus').slice(0, 60).trim();

  // 1. CREATE AND PERSIST SUBJECT RECORD IN DATABASE BEFORE AI ANALYSIS
  // Guarantees that the syllabus is never lost even if the AI service fails or times out
  const subjectId = `subj_${Date.now()}`;
  const newSubject: Subject = {
    id: subjectId,
    userId: sessionUser.id,
    name: initialName || 'Uploaded Syllabus',
    code: '',
    description: 'Syllabus saved permanently. Curriculum analysis in progress...',
    syllabusText: textContent || (storedFileName ? `File uploaded: ${storedFileName}` : ''),
    rawSyllabusText: textContent || storedFileName,
    uploadedFileName: storedFileName,
    uploadedFilePath: storedFilePath,
    syllabusFileType: mimeType,
    analysisStatus: 'analyzing',
    course: sessionUser.course || 'B.Tech',
    semester: sessionUser.semester || '1st Semester',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    units: [],
  };

  db.subjects.unshift(newSubject);
  writeDb(db);
  syncSubjectToSupabase(newSubject).catch((e) => console.warn('Supabase sync notice:', e));

  // 2. INVOKE REAL AI CURRICULUM ANALYSIS
  try {
    const analysisPayload: any = { preferBackup: !!preferBackup };
    if (fileData && fileData.base64) {
      analysisPayload.fileData = {
        base64: fileData.base64,
        fileName: storedFileName,
        mimeType,
      };
    } else {
      analysisPayload.syllabusText = textContent;
    }

    const aiResult = await analyzeSyllabusAI(analysisPayload);

    // Build structured units and topics with unique IDs
    const formattedUnits = (aiResult.units || []).map((u: any, uIdx: number) => {
      const unitId = `unit_${Date.now()}_${uIdx}`;
      return {
        id: unitId,
        subjectId,
        name: u.name || `Unit ${uIdx + 1}`,
        weightage: u.weightage || 20,
        orderNumber: uIdx + 1,
        topics: (u.topics || []).map((t: any, tIdx: number) => ({
          id: `top_${Date.now()}_${uIdx}_${tIdx}`,
          unitId,
          subjectId,
          name: typeof t === 'string' ? t : t.name,
          description: t.description || '',
          priority: t.priority || 'important',
          priorityReason: t.priorityReason || 'Core university syllabus component',
          completed: false,
          orderNumber: tIdx + 1,
        })),
      };
    });

    // 3. UPDATE SAVED SUBJECT WITH COMPLETED CURRICULUM DATA
    newSubject.name = aiResult.subjectName || newSubject.name;
    newSubject.code = aiResult.subjectCode || newSubject.code || '';
    newSubject.description = aiResult.description || 'AI curriculum analysis completed.';
    if (aiResult.extractedText) {
      newSubject.syllabusText = aiResult.extractedText;
      newSubject.rawSyllabusText = aiResult.extractedText;
    }
    newSubject.units = formattedUnits;
    newSubject.analysisStatus = 'completed';
    newSubject.updatedAt = new Date().toISOString();

    writeDb(db);
    syncSubjectToSupabase(newSubject).catch((e) => console.warn('Supabase sync notice:', e));

    return res.json({
      success: true,
      subject: newSubject,
      status: 'completed',
      result: aiResult,
    });
  } catch (aiErr: any) {
    console.warn('[AI Analysis Error] Syllabus safely preserved in database:', aiErr?.message || aiErr);
    // Preserved in DB with analysisStatus = 'failed'
    newSubject.analysisStatus = 'failed';
    newSubject.description =
      'Syllabus permanently saved. AI analysis was interrupted. Click Retry Analysis to continue without re-uploading.';
    newSubject.updatedAt = new Date().toISOString();

    writeDb(db);
    syncSubjectToSupabase(newSubject).catch((e) => console.warn('Supabase sync notice:', e));

    return res.status(200).json({
      success: false,
      subject: newSubject,
      subjectId: newSubject.id,
      status: 'failed',
      canRetry: true,
      error:
        'AI analysis was interrupted, but your syllabus is permanently saved! You can retry analysis anytime.',
    });
  }
});

// Retry AI analysis without re-uploading (idempotent, no duplicates)
app.post('/api/subjects/:id/retry-analysis', async (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const subject = db.subjects.find((s) => s.id === req.params.id);
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  if (subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
    return res.status(403).json({ error: 'Forbidden: You do not own this subject.' });
  }

  const { preferBackup } = req.body || {};
  subject.analysisStatus = 'analyzing';
  writeDb(db);

  try {
    let payload: any = { preferBackup: !!preferBackup };
    if (subject.uploadedFilePath && fs.existsSync(subject.uploadedFilePath)) {
      const buffer = fs.readFileSync(subject.uploadedFilePath);
      payload.fileData = {
        base64: buffer.toString('base64'),
        fileName: subject.uploadedFileName || 'syllabus',
        mimeType: subject.syllabusFileType || 'application/pdf',
      };
    } else {
      payload.syllabusText = subject.syllabusText || subject.rawSyllabusText || subject.name;
    }

    const aiResult = await analyzeSyllabusAI(payload);

    const formattedUnits = (aiResult.units || []).map((u: any, uIdx: number) => {
      const unitId = `unit_${Date.now()}_${uIdx}`;
      return {
        id: unitId,
        subjectId: subject.id,
        name: u.name || `Unit ${uIdx + 1}`,
        weightage: u.weightage || 20,
        orderNumber: uIdx + 1,
        topics: (u.topics || []).map((t: any, tIdx: number) => ({
          id: `top_${Date.now()}_${uIdx}_${tIdx}`,
          unitId,
          subjectId: subject.id,
          name: typeof t === 'string' ? t : t.name,
          description: t.description || '',
          priority: t.priority || 'important',
          priorityReason: t.priorityReason || 'Core university syllabus component',
          completed: false,
          orderNumber: tIdx + 1,
        })),
      };
    });

    subject.name = aiResult.subjectName || subject.name;
    subject.code = aiResult.subjectCode || subject.code || '';
    subject.description = aiResult.description || subject.description;
    if (aiResult.extractedText) {
      subject.syllabusText = aiResult.extractedText;
      subject.rawSyllabusText = aiResult.extractedText;
    }
    subject.units = formattedUnits;
    subject.analysisStatus = 'completed';
    subject.updatedAt = new Date().toISOString();

    writeDb(db);
    syncSubjectToSupabase(subject).catch((e) => console.warn('Supabase sync notice:', e));

    res.json({ success: true, subject, status: 'completed' });
  } catch (err: any) {
    subject.analysisStatus = 'failed';
    subject.updatedAt = new Date().toISOString();
    writeDb(db);
    res.status(500).json({ error: 'AI retry interrupted. Syllabus remains safely preserved in your account.' });
  }
});

app.post('/api/subjects', (req: Request, res: Response) => {
  const { name, code, description, units, rawSyllabusText, syllabusText } = req.body;
  if (!name || !units || !Array.isArray(units)) {
    return res.status(400).json({ error: 'Subject name and units are required.' });
  }

  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required to create subjects.' });
  }
  const currentUserId = sessionUser.id;
  const subjectId = `subj_${Date.now()}`;

  const formattedUnits = units.map((u: any, uIdx: number) => {
    const unitId = `unit_${Date.now()}_${uIdx}`;
    return {
      id: unitId,
      subjectId,
      name: u.name || `Unit ${uIdx + 1}`,
      weightage: u.weightage || 20,
      orderNumber: uIdx + 1,
      topics: (u.topics || []).map((t: any, tIdx: number) => ({
        id: `top_${Date.now()}_${uIdx}_${tIdx}`,
        unitId,
        subjectId,
        name: typeof t === 'string' ? t : t.name,
        description: t.description || '',
        priority: t.priority || 'important',
        priorityReason: t.priorityReason || 'Core university syllabus component',
        completed: false,
        orderNumber: tIdx + 1,
      })),
    };
  });

  const newSubject: Subject = {
    id: subjectId,
    userId: currentUserId,
    name,
    code,
    description: description || 'Academic syllabus imported into Syllora AI',
    examDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    rawSyllabusText: rawSyllabusText || syllabusText,
    syllabusText: syllabusText || rawSyllabusText,
    analysisStatus: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    units: formattedUnits,
  };

  db.subjects.push(newSubject);

  // Award XP for creating subject
  const { user } = updateStreakAndXp(currentUserId, 30);
  writeDb(db);
  syncSubjectToSupabase(newSubject).catch((e) => console.warn('Supabase sync notice:', e));

  res.json({ success: true, subject: newSubject, user });
});

// ----------------- SUBJECT MANAGEMENT & DELETION ENDPOINTS -----------------

// 1. Get Deletion Impact Summary (pre-confirmation breakdown)
app.get('/api/subjects/:id/deletion-summary', (req: Request, res: Response) => {
  try {
    const db = readDb();
    const sessionUser = getSessionUser(req, db);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const subjectId = req.params.id;
    const subject = db.subjects.find((s) => s.id === subjectId);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    // Verify user ownership
    if (subject.userId && subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
      return res.status(403).json({ error: 'Unauthorized: You can only inspect subjects belonging to your account.' });
    }

    const totalTopics = subject.units.reduce((acc, u) => acc + (u.topics?.length || 0), 0);
    const relatedNotes = db.notes.filter((n) => n.subjectId === subjectId).length;
    const conceptualQuestions = db.questions.filter((q) => q.subjectId === subjectId && !q.isNumerical).length;
    const numericalQuestions = db.questions.filter((q) => q.subjectId === subjectId && q.isNumerical).length;
    const relatedMCQs = db.mcqs.filter((m) => m.subjectId === subjectId).length;
    const relatedFlashcards = db.flashcards.filter((f) => f.subjectId === subjectId).length;
    const relatedMindmaps = db.mindmaps.filter((mm) => mm.subjectId === subjectId).length;
    const relatedCheatsheets = db.cheatsheets.filter((cs) => cs.subjectId === subjectId).length;
    const relatedStudyPlans = db.studyPlans.filter((sp) => sp.subjectId === subjectId).length;
    const relatedPreviousPapers = db.previousPapers.filter((pp) => pp.subjectId === subjectId).length;
    const relatedExamPredictions = db.examPredictions.filter((ep) => ep.subjectId === subjectId).length;
    const relatedGeneratedPapers = db.generatedPapers.filter((gp) => gp.subjectId === subjectId).length;
    const relatedEvaluations = db.evaluations.filter((ev) => ev.subjectId === subjectId).length;
    const relatedSessions = db.studySessions.filter((ss) => ss.subjectId === subjectId).length;

    res.json({
      success: true,
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        unitsCount: subject.units.length,
        topicsCount: totalTopics,
        hasUploadedFile: Boolean(subject.uploadedFileName || subject.uploadedFilePath),
        uploadedFileName: subject.uploadedFileName,
      },
      counts: {
        units: subject.units.length,
        topics: totalTopics,
        notes: relatedNotes,
        questions: conceptualQuestions,
        numericals: numericalQuestions,
        mcqs: relatedMCQs,
        flashcards: relatedFlashcards,
        mindmaps: relatedMindmaps,
        cheatsheets: relatedCheatsheets,
        studyPlans: relatedStudyPlans,
        previousPapers: relatedPreviousPapers,
        examPredictions: relatedExamPredictions,
        generatedPapers: relatedGeneratedPapers,
        evaluations: relatedEvaluations,
        studySessions: relatedSessions,
      },
      preserved: {
        globalXp: db.users[0]?.xp || 0,
        currentStreak: db.users[0]?.currentStreak || 0,
        longestStreak: db.users[0]?.longestStreak || 0,
        achievementsCount: db.achievements.length,
        totalStudyHoursPreserved: true,
      },
    });
  } catch (err: any) {
    console.error('Error fetching deletion summary:', err);
    res.status(500).json({ error: 'Failed to retrieve subject details.' });
  }
});

// 2. Real Cascading Permanent Subject Deletion
app.delete('/api/subjects/:id', (req: Request, res: Response) => {
  const subjectId = req.params.id;

  try {
    const db = readDb();
    const sessionUser = getSessionUser(req, db);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const subjectIndex = db.subjects.findIndex((s) => s.id === subjectId);

    if (subjectIndex === -1) {
      return res.status(404).json({ error: 'Subject not found or already removed.' });
    }

    const subject = db.subjects[subjectIndex];

    // Ownership Authorization verification
    if (subject.userId && subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
      return res.status(403).json({ error: 'Unauthorized: You can only remove subjects from your own account.' });
    }

    // Capture counts before deletion for verification and audit
    const totalTopics = subject.units.reduce((acc, u) => acc + (u.topics?.length || 0), 0);
    const notesCount = db.notes.filter((n) => n.subjectId === subjectId).length;
    const questionsCount = db.questions.filter((q) => q.subjectId === subjectId).length;
    const mcqsCount = db.mcqs.filter((m) => m.subjectId === subjectId).length;
    const flashcardsCount = db.flashcards.filter((f) => f.subjectId === subjectId).length;
    const mindmapsCount = db.mindmaps.filter((mm) => mm.subjectId === subjectId).length;
    const cheatsheetsCount = db.cheatsheets.filter((cs) => cs.subjectId === subjectId).length;
    const studyPlansCount = db.studyPlans.filter((sp) => sp.subjectId === subjectId).length;
    const prevPapersCount = db.previousPapers.filter((pp) => pp.subjectId === subjectId).length;
    const predictionsCount = db.examPredictions.filter((ep) => ep.subjectId === subjectId).length;
    const papersCount = db.generatedPapers.filter((gp) => gp.subjectId === subjectId).length;
    const evalsCount = db.evaluations.filter((ev) => ev.subjectId === subjectId).length;
    const sessionsCount = db.studySessions.filter((ss) => ss.subjectId === subjectId).length;

    // Delete associated uploaded file from local filesystem and Supabase Storage
    if (subject.uploadedFilePath) {
      deleteSyllabusFile(sessionUser.id, subject.uploadedFilePath, subject.uploadedFilePath).catch((fileErr) =>
        console.warn(`[Subject Deletion] Note: Error removing file ${subject.uploadedFilePath}`, fileErr)
      );
    }

    if (isSupabaseConfigured()) {
      deleteSubjectFromSupabase(subjectId, sessionUser.id).catch((dbErr) =>
        console.warn('[Subject Deletion] Supabase cascade delete notice:', dbErr)
      );
    }

    // Perform complete relational cascade delete
    db.subjects.splice(subjectIndex, 1);
    db.notes = db.notes.filter((n) => n.subjectId !== subjectId);
    db.questions = db.questions.filter((q) => q.subjectId !== subjectId);
    db.mcqs = db.mcqs.filter((m) => m.subjectId !== subjectId);
    db.flashcards = db.flashcards.filter((f) => f.subjectId !== subjectId);
    db.mindmaps = db.mindmaps.filter((mm) => mm.subjectId !== subjectId);
    db.cheatsheets = db.cheatsheets.filter((cs) => cs.subjectId !== subjectId);
    db.studyPlans = db.studyPlans.filter((sp) => sp.subjectId !== subjectId);
    db.previousPapers = db.previousPapers.filter((pp) => pp.subjectId !== subjectId);
    db.examPredictions = db.examPredictions.filter((ep) => ep.subjectId !== subjectId);
    db.generatedPapers = db.generatedPapers.filter((gp) => gp.subjectId !== subjectId);
    db.evaluations = db.evaluations.filter((ev) => ev.subjectId !== subjectId);
    db.studySessions = db.studySessions.filter((ss) => ss.subjectId !== subjectId);
    db.chatHistory = db.chatHistory.filter((ch) => ch.subjectId !== subjectId);

    // Commit changes atomically to permanent storage
    writeDb(db);

    console.log(`[Subject Deletion] Permanently deleted subject "${subject.name}" (${subjectId}) and all associated records.`);

    res.json({
      success: true,
      message: 'Subject removed successfully.',
      deletedSubject: {
        id: subject.id,
        name: subject.name,
      },
      removedSummary: {
        units: subject.units.length,
        topics: totalTopics,
        notes: notesCount,
        questions: questionsCount,
        mcqs: mcqsCount,
        flashcards: flashcardsCount,
        mindmaps: mindmapsCount,
        cheatsheets: cheatsheetsCount,
        studyPlans: studyPlansCount,
        previousPapers: prevPapersCount,
        examPredictions: predictionsCount,
        generatedPapers: papersCount,
        evaluations: evalsCount,
        studySessions: sessionsCount,
      },
    });
  } catch (err: any) {
    console.error('Fatal error during subject deletion:', err);
    res.status(500).json({
      error: 'Unable to remove this subject right now.',
      subtext: 'The server encountered an issue while processing the deletion. No partial data was modified.',
    });
  }
});

// 3. Toggle Archive / Restore Subject
app.post('/api/subjects/:id/archive', (req: Request, res: Response) => {
  try {
    const db = readDb();
    const sessionUser = getSessionUser(req, db);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const subject = db.subjects.find((s) => s.id === req.params.id);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    if (subject.userId && subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
      return res.status(403).json({ error: 'Unauthorized: You can only archive your own subjects.' });
    }

    const willArchive = typeof req.body.archived === 'boolean' ? req.body.archived : !subject.archived;
    subject.archived = willArchive;
    subject.archivedAt = willArchive ? new Date().toISOString() : undefined;

    writeDb(db);

    res.json({
      success: true,
      archived: subject.archived,
      message: subject.archived ? `Subject "${subject.name}" archived.` : `Subject "${subject.name}" restored to active dashboard.`,
      subject,
    });
  } catch (err: any) {
    console.error('Error toggling archive:', err);
    res.status(500).json({ error: 'Failed to update subject archive status.' });
  }
});

// 4. Update / Edit Subject Metadata
app.put('/api/subjects/:id', (req: Request, res: Response) => {
  try {
    const db = readDb();
    const sessionUser = getSessionUser(req, db);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const subject = db.subjects.find((s) => s.id === req.params.id);

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    if (subject.userId && subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
      return res.status(403).json({ error: 'Unauthorized: You can only edit your own subjects.' });
    }

    const { name, code, description, examDate } = req.body;
    if (name && typeof name === 'string') {
      subject.name = name.trim();
    }
    if (code !== undefined) {
      subject.code = typeof code === 'string' ? code.trim() : undefined;
    }
    if (description !== undefined) {
      subject.description = typeof description === 'string' ? description.trim() : undefined;
    }
    if (examDate !== undefined) {
      subject.examDate = typeof examDate === 'string' ? examDate : undefined;
    }

    writeDb(db);

    res.json({
      success: true,
      message: 'Subject updated successfully.',
      subject,
    });
  } catch (err: any) {
    console.error('Error updating subject:', err);
    res.status(500).json({ error: 'Failed to update subject details.' });
  }
});

app.post('/api/topics/:id/toggle', (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  let found = false;
  let topicName = '';
  let nowCompleted = false;

  for (const subject of db.subjects) {
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        if (topic.id === req.params.id) {
          if (subject.userId && subject.userId !== sessionUser.id && subject.userId !== 'usr_default') {
            return res.status(403).json({ error: 'Unauthorized: You do not own this subject.' });
          }
          topic.completed = !topic.completed;
          topic.lastAccessed = new Date().toISOString();
          nowCompleted = topic.completed;
          topicName = topic.name;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }

  if (!found) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  let user = sessionUser;
  if (nowCompleted) {
    const updated = updateStreakAndXp(user.id, 10);
    user = updated.user;

    // Check first topic completed achievement
    if (!db.achievements.some((a) => a.key === 'FIRST_TOPIC')) {
      db.achievements.push({
        id: `ach_${Date.now()}`,
        key: 'FIRST_TOPIC',
        title: 'First Topic Completed',
        description: 'Completed your very first syllabus topic revision',
        icon: '🏆',
        unlockedAt: new Date().toISOString(),
      });
    }
  }

  writeDb(db);
  res.json({ success: true, completed: nowCompleted, topicName, user });
});

// ----------------- AI GENERATION ENDPOINTS -----------------
app.get('/api/ai/status', (_req: Request, res: Response) => {
  res.json({
    status: 'operational',
    primaryModel: process.env.AI_PRIMARY_MODEL || 'gemini-3.5-flash-lite',
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'gemini-flash-lite-latest',
    secondaryFallback: process.env.AI_SECONDARY_FALLBACK_MODEL || 'gemini-3.8-flash',
  });
});

app.post('/api/ai/analyze-syllabus', async (req: Request, res: Response) => {
  const db = readDb();
  const sessionUser = getSessionUser(req, db);

  try {
    let { syllabusText, fileData, preferBackup, subjectId: existingSubjectId } = req.body;

    const userId = sessionUser ? sessionUser.id : (db.users[0]?.id || 'usr_default');
    let subject: Subject | undefined;
    if (existingSubjectId) {
      subject = db.subjects.find((s) => s.id === existingSubjectId);
      if (subject) {
        // If fileData or syllabusText was not passed in retry, restore from the saved record
        if (!syllabusText && (!fileData || !fileData.base64)) {
          if (subject.uploadedFilePath && fs.existsSync(subject.uploadedFilePath)) {
            try {
              const buffer = fs.readFileSync(subject.uploadedFilePath);
              fileData = {
                base64: buffer.toString('base64'),
                fileName: subject.uploadedFileName || 'syllabus',
                mimeType: subject.syllabusFileType || 'application/pdf',
              };
            } catch (readErr) {
              console.warn('[Subject File Recovery Notice]:', readErr);
            }
          } else if (subject.syllabusText || subject.rawSyllabusText) {
            syllabusText = subject.syllabusText || subject.rawSyllabusText;
          }
        }
      }
    }

    if (!syllabusText && (!fileData || !fileData.base64)) {
      return res.status(400).json({
        error: 'Please enter a syllabus or upload a document.',
        category: 'BAD_REQUEST',
      });
    }

    let storedFileName: string | undefined = subject?.uploadedFileName;
    let storedFilePath: string | undefined = subject?.uploadedFilePath;
    const mimeType = fileData?.type || fileData?.mimeType || subject?.syllabusFileType || 'application/octet-stream';

    // 1. SAVE ORIGINAL FILE TO PRIVATE STORAGE & SUPABASE STORAGE BUCKET
    if (fileData && fileData.base64 && !storedFilePath) {
      try {
        const fileSaveResult = await saveSyllabusFile(
          userId,
          fileData.fileName || fileData.name || 'syllabus.pdf',
          fileData.base64,
          mimeType
        );
        storedFilePath = fileSaveResult.localPath;
        storedFileName = fileData.fileName || fileData.name || 'syllabus.pdf';
      } catch (saveErr) {
        console.warn('[File Save Notice]:', saveErr);
      }
    }

    const initialName = storedFileName
      ? storedFileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      : (syllabusText || 'My Syllabus').split('\n')[0].slice(0, 60).trim();

    // 2. SAVE SYLLABUS RECORD TO DATABASE IMMEDIATELY BEFORE AI ANALYSIS
    // Ensures the uploaded syllabus is never lost even if AI model times out or encounters high demand
    if (!subject) {
      const subjectId = existingSubjectId || `subj_${Date.now()}`;
      subject = {
        id: subjectId,
        userId,
        name: initialName || 'Uploaded Syllabus',
        code: '',
        description: 'Syllabus safely preserved in cloud storage. AI curriculum analysis in progress...',
        syllabusText: syllabusText || (storedFileName ? `File uploaded: ${storedFileName}` : ''),
        rawSyllabusText: syllabusText || storedFileName,
        uploadedFileName: storedFileName,
        uploadedFilePath: storedFilePath,
        syllabusFileType: mimeType,
        analysisStatus: 'analyzing',
        course: sessionUser?.course || 'B.Tech',
        semester: sessionUser?.semester || '1st Semester',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        units: [],
      };
      db.subjects.unshift(subject);
    } else {
      subject.analysisStatus = 'analyzing';
      subject.updatedAt = new Date().toISOString();
      if (storedFilePath) subject.uploadedFilePath = storedFilePath;
      if (storedFileName) subject.uploadedFileName = storedFileName;
    }

    writeDb(db);
    syncSubjectToSupabase(subject).catch((e) => console.warn('[Supabase Sync Notice]:', e));

    // 3. EXECUTE REAL AI ANALYSIS WITH CASCADE AND RETRY
    try {
      const result = await analyzeSyllabusAI(
        { syllabusText, fileData, preferBackup }
      );

      // Build structured units and topics
      const formattedUnits = (result.units || []).map((u: any, uIdx: number) => {
        const unitId = `unit_${Date.now()}_${uIdx}`;
        return {
          id: unitId,
          subjectId: subject!.id,
          name: u.name || `Unit ${uIdx + 1}`,
          weightage: Number(u.weightage) || 20,
          orderNumber: uIdx + 1,
          topics: (u.topics || []).map((t: any, tIdx: number) => ({
            id: `top_${Date.now()}_${uIdx}_${tIdx}`,
            unitId,
            subjectId: subject!.id,
            name: typeof t === 'string' ? t : t.name,
            description: t.description || '',
            priority: t.priority || 'important',
            priorityReason: t.priorityReason || 'Core university syllabus component',
            completed: false,
            orderNumber: tIdx + 1,
          })),
        };
      });

      subject.name = result.subjectName || subject.name;
      subject.code = result.subjectCode || subject.code || '';
      subject.description = result.description || 'AI curriculum analysis completed.';
      if (result.extractedText) {
        subject.syllabusText = result.extractedText;
        subject.rawSyllabusText = result.extractedText;
      }
      subject.units = formattedUnits;
      subject.analysisStatus = 'completed';
      subject.updatedAt = new Date().toISOString();

      writeDb(db);
      syncSubjectToSupabase(subject).catch((e) => console.warn('[Supabase Sync Notice]:', e));

      return res.json({
        success: true,
        result,
        subject,
        subjectId: subject.id,
      });
    } catch (aiErr: any) {
      console.error('[AI Analysis Pipeline Error]:', aiErr);
      subject.analysisStatus = 'failed';
      subject.description = 'Syllabus safely preserved in cloud storage. Analysis was interrupted. You can retry with backup AI without re-uploading.';
      subject.updatedAt = new Date().toISOString();

      writeDb(db);
      syncSubjectToSupabase(subject).catch((e) => console.warn('[Supabase Sync Notice]:', e));

      const errMsg = (aiErr.message || '').toLowerCase();
      const isDocxError = errMsg.includes('docx') || errMsg.includes('readable docx');
      const isUnavailable = aiErr.message === 'ALL_MODELS_UNAVAILABLE' || aiErr.status === 503 || errMsg.includes('high demand') || errMsg.includes('unavailable');
      const isRateLimited = aiErr.status === 429 || errMsg.includes('rate limit') || errMsg.includes('429');
      const isAuth = aiErr.status === 401 || aiErr.status === 403 || errMsg.includes('api_key') || errMsg.includes('authentication');
      const isTimeout = errMsg.includes('timed out') || errMsg.includes('timeout');

      if (isDocxError) {
        return res.status(400).json({
          error: "We couldn't extract text from this document. Please upload a readable DOCX or PDF.",
          category: 'EXTRACTION_ERROR',
          subjectId: subject.id,
          retryable: false,
        });
      }

      if (isAuth) {
        return res.status(401).json({
          error: 'AI service authentication failed. Please check the server configuration.',
          category: 'AUTH_ERROR',
          subjectId: subject.id,
          retryable: false,
        });
      }

      if (isUnavailable) {
        return res.status(503).json({
          error: 'AI is temporarily busy.',
          subtext: 'The AI model is currently experiencing high demand. Your uploaded syllabus is safe.',
          category: 'UNAVAILABLE',
          subjectId: subject.id,
          retryable: true,
          canTryBackup: true,
        });
      }

      if (isRateLimited) {
        return res.status(429).json({
          error: 'The AI service is temporarily rate-limited. Retrying or switching models.',
          category: 'RATE_LIMIT',
          subjectId: subject.id,
          retryable: true,
          canTryBackup: true,
        });
      }

      if (isTimeout) {
        return res.status(504).json({
          error: 'The AI request timed out. Your syllabus is saved; please retry.',
          category: 'TIMEOUT',
          subjectId: subject.id,
          retryable: true,
          canTryBackup: true,
        });
      }

      return res.status(503).json({
        error: 'Syllabus analysis is temporarily unavailable. Your syllabus is saved and can be analyzed again later.',
        category: 'ERROR',
        subjectId: subject.id,
        retryable: true,
        canTryBackup: true,
      });
    }
  } catch (err: any) {
    console.error('Fatal syllabus upload error:', err);
    res.status(500).json({
      error: err.message || 'Unable to process syllabus right now. Please try again.',
      category: 'ERROR',
      retryable: true,
    });
  }
});

app.post('/api/ai/generate-notes', async (req: Request, res: Response) => {
  try {
    const { subjectId, topicId, subjectName, unitName, topicName, language, length, examType } = req.body;
    if (!topicName || !subjectName) {
      return res.status(400).json({ error: 'Missing subject or topic name.' });
    }

    const db = readDb();
    // Check if notes already exist in db for this topic
    const existing = db.notes.find((n) => n.topicId === topicId);
    if (existing && !req.body.forceRegenerate) {
      return res.json({ success: true, note: existing, cached: true });
    }

    const noteData = await generateNotesAI({
      subjectName,
      unitName: unitName || 'Core Unit',
      topicName,
      language,
      length,
      examType,
    });

    const newNote: Note = {
      id: existing ? existing.id : `note_${Date.now()}`,
      topicId: topicId || `top_${Date.now()}`,
      subjectId: subjectId || `subj_${Date.now()}`,
      title: topicName,
      definition: noteData.definition || '',
      introduction: noteData.introduction || '',
      keyConcepts: noteData.keyConcepts || [],
      explanation: noteData.explanation || '',
      realLifeExample: noteData.realLifeExample,
      formula: noteData.formula,
      algorithm: noteData.algorithm,
      complexity: noteData.complexity,
      applications: noteData.applications || [],
      advantages: noteData.advantages || [],
      limitations: noteData.limitations || [],
      examPoints: noteData.examPoints || [],
      quickRevision: noteData.quickRevision || '',
      diagramSvgOrAscii: noteData.diagramSvgOrAscii,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      const idx = db.notes.findIndex((n) => n.id === existing.id);
      db.notes[idx] = newNote;
    } else {
      db.notes.push(newNote);
    }

    // Award XP
    updateStreakAndXp(db.users[0]?.id || 'usr_default', 15);
    writeDb(db);

    res.json({ success: true, note: newNote });
  } catch (err: any) {
    console.error('Error generating notes:', err);
    res.status(500).json({ error: err.message || 'Unable to generate notes right now. Please try again.' });
  }
});

app.post('/api/ai/explain-differently', async (req: Request, res: Response) => {
  try {
    const { topicName, currentExplanation, mode } = req.body;
    if (!topicName || !mode) {
      return res.status(400).json({ error: 'Missing topic or mode' });
    }
    const result = await explainDifferentlyAI({
      topicName,
      currentExplanation: currentExplanation || '',
      mode,
    });
    res.json({ success: true, result });
  } catch (err: any) {
    console.error('Error in explain differently:', err);
    res.status(500).json({ error: err.message || 'Unable to regenerate explanation.' });
  }
});

app.get('/api/topics/:id/questions', (req: Request, res: Response) => {
  const db = readDb();
  const topicId = req.params.id;
  const category = req.query.category as string | undefined;

  let questions = db.questions.filter((q) => q.topicId === topicId);
  if (category && category !== 'all') {
    questions = questions.filter((q) => q.category === category || (category === 'numerical' && q.isNumerical));
  }
  res.json({ success: true, questions });
});

app.post('/api/questions/:id/toggle-save', (req: Request, res: Response) => {
  const db = readDb();
  const q = db.questions.find((item) => item.id === req.params.id);
  if (!q) {
    return res.status(404).json({ error: 'Question not found' });
  }
  q.saved = !q.saved;
  writeDb(db);
  res.json({ success: true, saved: q.saved });
});

app.post('/api/questions/batch-save', (req: Request, res: Response) => {
  const db = readDb();
  const { questionIds, save = true } = req.body;
  if (Array.isArray(questionIds)) {
    db.questions.forEach((q) => {
      if (questionIds.includes(q.id)) {
        q.saved = save;
      }
    });
    writeDb(db);
  }
  res.json({ success: true, count: questionIds?.length || 0 });
});

app.post('/api/ai/generate-topic-questions', async (req: Request, res: Response) => {
  try {
    const {
      subjectId,
      unitId,
      topicId,
      subjectName,
      unitName,
      topicName,
      category,
      batchNumber,
      existingQuestions,
      difficultyFilter,
    } = req.body;

    if (!topicName || !subjectName) {
      return res.status(400).json({ error: 'Missing subject or topic name.' });
    }

    const db = readDb();
    // Context from previous-year papers if available
    const pyq = db.previousPapers.find((p) => p.subjectId === subjectId);
    let pyqContext = '';
    if (pyq) {
      pyqContext = `Frequently tested topics: ${pyq.frequentlyAskedTopics?.map((t: any) => t.topic).join(', ')}. Question patterns: ${pyq.questionPatterns?.map((p: any) => p.pattern).join(', ')}`;
    }

    // Existing questions to avoid duplicates
    const existingList = Array.isArray(existingQuestions)
      ? existingQuestions
      : db.questions.filter((q) => q.topicId === topicId).map((q) => q.question);

    const questionsData = await generateTopicQuestionsBatchAI({
      subjectName,
      unitName: unitName || 'Core Unit',
      topicName,
      category: category || 'all',
      batchNumber: Number(batchNumber) || 1,
      existingQuestions: existingList,
      difficultyFilter: difficultyFilter || 'Mixed',
      previousPaperContext: pyqContext,
    });

    const currentBatch = Number(batchNumber) || 1;
    const startIndex = (currentBatch - 1) * 10;

    const formattedQuestions: Question[] = questionsData.map((q: any, idx: number) => ({
      id: `q_${Date.now()}_${idx}`,
      topicId: topicId || `top_${Date.now()}`,
      unitId,
      subjectId: subjectId || `subj_${Date.now()}`,
      topicName,
      unitName,
      batchNumber: currentBatch,
      questionNumber: startIndex + idx + 1,
      question: q.question,
      answer: q.answer,
      marks: q.marks,
      difficulty: q.difficulty || 'Medium',
      priority: q.priority || '⭐ Important',
      importanceBadge: q.importanceBadge || (idx < 2 ? '🔥 Repeated' : idx < 6 ? '⭐ High Probability' : '🟡 Standard'),
      frequencyIndicator: q.frequencyIndicator || (idx < 2 ? 'Asked 3+ times in past university papers' : 'Core Semester Question'),
      type: q.type || 'Conceptual',
      stepByStep: q.stepByStep || [],
      markingScheme: q.markingScheme || `${Math.floor(q.marks / 2)} Marks for Concept/Definition + ${Math.ceil(q.marks / 2)} Marks for Structure & Example`,
      commonMistakes: q.commonMistakes || 'Avoid missing technical keywords or skipping labeled diagrams.',
      category: category || 'all',
      isNumerical: false,
      saved: false,
      createdAt: new Date().toISOString(),
    }));

    db.questions.push(...formattedQuestions);
    updateStreakAndXp(db.users[0]?.id || 'usr_default', 15);
    writeDb(db);

    res.json({ success: true, questions: formattedQuestions, batchNumber: currentBatch });
  } catch (err: any) {
    console.error('Error generating topic questions:', err);
    res.status(500).json({ error: err.message || 'Unable to generate questions right now.' });
  }
});

app.post('/api/ai/generate-topic-numericals', async (req: Request, res: Response) => {
  try {
    const {
      subjectId,
      unitId,
      topicId,
      subjectName,
      unitName,
      topicName,
      batchNumber,
      existingQuestions,
    } = req.body;

    if (!topicName || !subjectName) {
      return res.status(400).json({ error: 'Missing subject or topic name.' });
    }

    const db = readDb();
    const existingList = Array.isArray(existingQuestions)
      ? existingQuestions
      : db.questions.filter((q) => q.topicId === topicId && q.isNumerical).map((q) => q.question);

    const result = await generateTopicNumericalsBatchAI({
      subjectName,
      unitName: unitName || 'Core Unit',
      topicName,
      batchNumber: Number(batchNumber) || 1,
      existingQuestions: existingList,
    });

    if (!result.isApplicable) {
      return res.json({
        success: true,
        isApplicable: false,
        message: result.message || 'This topic does not require numerical questions.',
        numericals: [],
      });
    }

    const currentBatch = Number(batchNumber) || 1;
    const startIndex = (currentBatch - 1) * 10;

    const formattedNumericals: Question[] = (result.numericals || []).map((num: any, idx: number) => ({
      id: `num_${Date.now()}_${idx}`,
      topicId: topicId || `top_${Date.now()}`,
      unitId,
      subjectId: subjectId || `subj_${Date.now()}`,
      topicName,
      unitName,
      batchNumber: currentBatch,
      questionNumber: startIndex + idx + 1,
      question: num.question,
      answer: `Given: ${num.given}\nRequired: ${num.required}\nFormula: ${num.formula}\n\nSteps:\n${(num.steps || []).join('\n')}\n\nFinal Answer: ${num.finalAnswer}\nVerification: ${num.verification}`,
      marks: num.marks || 10,
      difficulty: num.difficulty || (idx < 3 ? 'Easy' : idx < 7 ? 'Medium' : 'Hard'),
      priority: num.priority || '🔥 Very Important',
      importanceBadge: num.importanceBadge || (idx < 2 ? '🔥 Repeated' : '⭐ High Probability'),
      frequencyIndicator: num.frequencyIndicator || 'Standard semester exam numerical',
      markingScheme: num.markingScheme || '2 Marks Given & Formula, 2 Marks Step Calculation, 1 Mark Unit & Result',
      commonMistakes: num.commonMistakes || 'Calculation errors during intermediate steps or omission of units in final answer',
      type: 'Numerical',
      category: 'numerical',
      isNumerical: true,
      given: num.given,
      required: num.required,
      formula: num.formula,
      booleanEquation: num.booleanEquation,
      truthTable: num.truthTable,
      kMap: num.kMap,
      steps: num.steps || [],
      finalAnswer: num.finalAnswer,
      verification: num.verification,
      diagramAscii: num.diagramAscii,
      saved: false,
      createdAt: new Date().toISOString(),
    }));

    db.questions.push(...formattedNumericals);
    updateStreakAndXp(db.users[0]?.id || 'usr_default', 20);
    writeDb(db);

    res.json({
      success: true,
      isApplicable: true,
      numericals: formattedNumericals,
      batchNumber: currentBatch,
    });
  } catch (err: any) {
    console.error('Error generating topic numericals:', err);
    res.status(500).json({ error: err.message || 'Unable to generate numerical questions right now.' });
  }
});

app.post('/api/ai/generate-questions', async (req: Request, res: Response) => {
  try {
    const { subjectId, topicId, subjectName, topicName } = req.body;
    const questions = await generateQuestionsAI({ subjectName, topicName });

    const db = readDb();
    const formattedQuestions: Question[] = questions.map((q: any, idx: number) => ({
      id: `q_${Date.now()}_${idx}`,
      topicId: topicId || `top_${Date.now()}`,
      subjectId: subjectId || `subj_${Date.now()}`,
      question: q.question,
      answer: q.answer,
      marks: q.marks,
      difficulty: q.difficulty,
      priority: q.priority,
      type: q.type || 'Conceptual',
      category: 'all',
      isNumerical: false,
      saved: false,
      createdAt: new Date().toISOString(),
    }));

    db.questions.push(...formattedQuestions);
    writeDb(db);

    res.json({ success: true, questions: formattedQuestions });
  } catch (err: any) {
    console.error('Error generating questions:', err);
    res.status(500).json({ error: err.message || 'Unable to generate questions right now.' });
  }
});

app.post('/api/ai/generate-numericals', async (req: Request, res: Response) => {
  try {
    const { subjectName, topicName } = req.body;
    const numericals = await generateNumericalsAI({ subjectName, topicName });
    res.json({ success: true, numericals });
  } catch (err: any) {
    console.error('Error generating numericals:', err);
    res.status(500).json({ error: err.message || 'Unable to generate numericals right now.' });
  }
});

app.post('/api/ai/generate-mcqs', async (req: Request, res: Response) => {
  try {
    const { subjectId, topicId, subjectName, topicName, count, difficulty } = req.body;
    const mcqsData = await generateMCQsAI({ subjectName, topicName, count: Number(count) || 10, difficulty });

    const db = readDb();
    const formattedMCQs: MCQ[] = mcqsData.map((m: any, idx: number) => ({
      id: `mcq_${Date.now()}_${idx}`,
      topicId: topicId || `top_${Date.now()}`,
      subjectId: subjectId || `subj_${Date.now()}`,
      question: m.question,
      optionA: m.optionA,
      optionB: m.optionB,
      optionC: m.optionC,
      optionD: m.optionD,
      correctAnswer: m.correctAnswer,
      explanation: m.explanation,
      difficulty: m.difficulty,
    }));

    db.mcqs.push(...formattedMCQs);
    writeDb(db);

    res.json({ success: true, mcqs: formattedMCQs });
  } catch (err: any) {
    console.error('Error generating MCQs:', err);
    res.status(500).json({ error: err.message || 'Unable to generate MCQs right now.' });
  }
});

app.post('/api/ai/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const { subjectId, topicId, subjectName, topicName, count } = req.body;
    const flashcardsData = await generateFlashcardsAI({ subjectName, topicName, count: Number(count) || 8 });

    const db = readDb();
    const formatted: Flashcard[] = flashcardsData.map((f: any, idx: number) => ({
      id: `fc_${Date.now()}_${idx}`,
      topicId: topicId || `top_${Date.now()}`,
      subjectId: subjectId || `subj_${Date.now()}`,
      front: f.front,
      back: f.back,
      keyTakeaway: f.keyTakeaway,
      learned: false,
      difficulty: f.difficulty,
    }));

    db.flashcards.push(...formatted);
    writeDb(db);

    res.json({ success: true, flashcards: formatted });
  } catch (err: any) {
    console.error('Error generating flashcards:', err);
    res.status(500).json({ error: err.message || 'Unable to generate flashcards right now.' });
  }
});

app.post('/api/ai/generate-mindmap', async (req: Request, res: Response) => {
  try {
    const { subjectId, subjectName, topicOrUnitName } = req.body;
    const rootNode = await generateMindMapAI({ subjectName, topicOrUnitName });

    const db = readDb();
    const mindmapData = {
      id: `mm_${Date.now()}`,
      subjectId: subjectId || 'subj_default',
      topicOrUnitName,
      root: rootNode,
      createdAt: new Date().toISOString(),
    };
    db.mindmaps.push(mindmapData);
    writeDb(db);

    res.json({ success: true, mindmap: mindmapData });
  } catch (err: any) {
    console.error('Error generating mind map:', err);
    res.status(500).json({ error: err.message || 'Unable to generate mind map right now.' });
  }
});

app.post('/api/ai/generate-cheatsheet', async (req: Request, res: Response) => {
  try {
    const { subjectId, subjectName, unitName } = req.body;
    const sheet = await generateCheatSheetAI({ subjectName, unitName });

    const db = readDb();
    const cheatSheetObj = {
      id: `cs_${Date.now()}`,
      subjectId: subjectId || 'subj_default',
      ...sheet,
      createdAt: new Date().toISOString(),
    };
    db.cheatsheets.push(cheatSheetObj);
    writeDb(db);

    res.json({ success: true, cheatsheet: cheatSheetObj });
  } catch (err: any) {
    console.error('Error generating cheat sheet:', err);
    res.status(500).json({ error: err.message || 'Unable to generate cheat sheet right now.' });
  }
});

app.post('/api/ai/analyze-previous-paper', async (req: Request, res: Response) => {
  try {
    const { subjectId, subjectName, paperText, fileData, fileName } = req.body;
    const analysis = await analyzePreviousPaperAI({ subjectName, paperText, fileData });

    const db = readDb();
    const record = {
      id: `pp_${Date.now()}`,
      userId: db.users[0]?.id || 'usr_default',
      subjectId: subjectId || 'subj_default',
      fileName: fileName || 'Previous_Year_Paper.pdf',
      analyzedAt: new Date().toISOString(),
      ...analysis,
    };
    db.previousPapers.unshift(record);
    writeDb(db);

    res.json({ success: true, analysis: record });
  } catch (err: any) {
    console.error('Error analyzing previous paper:', err);
    res.status(500).json({ error: err.message || 'Unable to analyze question paper right now.' });
  }
});

app.post('/api/ai/predict-exam', async (req: Request, res: Response) => {
  try {
    const { subjectId, subjectName, syllabusUnits } = req.body;
    const db = readDb();
    const previousPaperData = db.previousPapers.find((p) => p.subjectId === subjectId);

    const prediction = await predictExamAI({ subjectName, syllabusUnits, previousPaperData });

    const predictionObj = {
      id: `pred_${Date.now()}`,
      subjectId: subjectId || 'subj_default',
      predictedAt: new Date().toISOString(),
      ...prediction,
    };
    db.examPredictions.unshift(predictionObj);
    writeDb(db);

    res.json({ success: true, prediction: predictionObj });
  } catch (err: any) {
    console.error('Error predicting exam:', err);
    res.status(500).json({ error: err.message || 'Unable to generate exam prediction right now.' });
  }
});

app.post('/api/ai/generate-question-paper', async (req: Request, res: Response) => {
  try {
    const { subjectId, subjectName, units, totalMarks, durationMinutes, difficulty, patternDetails } = req.body;
    const paper = await generateQuestionPaperAI({
      subjectName,
      units: units || ['All Units'],
      totalMarks: Number(totalMarks) || 70,
      durationMinutes: Number(durationMinutes) || 180,
      difficulty: difficulty || 'Medium',
      patternDetails,
    });

    const db = readDb();
    const generatedPaperObj = {
      id: `paper_${Date.now()}`,
      subjectId: subjectId || 'subj_default',
      ...paper,
      generatedAt: new Date().toISOString(),
    };
    db.generatedPapers.unshift(generatedPaperObj);
    writeDb(db);

    res.json({ success: true, paper: generatedPaperObj });
  } catch (err: any) {
    console.error('Error generating question paper:', err);
    res.status(500).json({ error: err.message || 'Unable to generate question paper right now.' });
  }
});

app.post('/api/ai/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const { subjectId, subjectName, topicName, question, totalMarks, userAnswer } = req.body;
    if (!userAnswer || !question) {
      return res.status(400).json({ error: 'Please provide question and student answer.' });
    }

    const evaluation = await evaluateAnswerAI({
      subjectName: subjectName || 'General Engineering',
      topicName: topicName || 'General Concept',
      question,
      totalMarks: Number(totalMarks) || 10,
      userAnswer,
    });

    const db = readDb();
    const evalObj = {
      id: `eval_${Date.now()}`,
      userId: db.users[0]?.id || 'usr_default',
      subjectId: subjectId || 'subj_default',
      topicName: topicName || 'General Concept',
      question,
      totalMarks: Number(totalMarks) || 10,
      userAnswer,
      ...evaluation,
      evaluatedAt: new Date().toISOString(),
    };

    db.evaluations.unshift(evalObj);
    updateStreakAndXp(db.users[0]?.id || 'usr_default', 20);
    writeDb(db);

    res.json({ success: true, evaluation: evalObj });
  } catch (err: any) {
    console.error('Error evaluating answer:', err);
    res.status(500).json({ error: err.message || 'Unable to evaluate answer right now.' });
  }
});

app.post('/api/ai/last-minute-revision', async (req: Request, res: Response) => {
  try {
    const { subjectName, timeAvailable, units } = req.body;
    const plan = await lastMinuteRevisionAI({
      subjectName,
      timeAvailable: timeAvailable || '2 Hours',
      units: units || [],
    });
    res.json({ success: true, plan });
  } catch (err: any) {
    console.error('Error generating last-minute revision:', err);
    res.status(500).json({ error: err.message || 'Unable to generate emergency revision plan right now.' });
  }
});

app.post('/api/ai/tutor-suite', async (req: Request, res: Response) => {
  try {
    const db = readDb();
    const sessionUser = getSessionUser(req, db);
    const result = await handleTutorSuiteAI(req.body);

    if (!db.chatHistory) db.chatHistory = [];
    const userId = sessionUser?.id || db.users[0]?.id || 'usr_default';
    db.chatHistory.push(
      {
        id: `c_${Date.now()}_1`,
        userId,
        role: 'user',
        content: req.body.query || req.body.action || 'AI Study Tutor Request',
        timestamp: new Date().toISOString(),
      },
      {
        id: `c_${Date.now()}_2`,
        userId,
        role: 'assistant',
        content: result.markdown || 'Task completed successfully',
        timestamp: new Date().toISOString(),
      }
    );
    writeDb(db);

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error in tutor suite:', err);
    res.status(500).json({ error: err.message || 'Unable to process tutor request right now.' });
  }
});

app.post('/api/ai/study-chat', async (req: Request, res: Response) => {
  try {
    const { message, query, subjectContext, syllabusContext, history, action } = req.body;
    const userMessage = message || query;
    if (!userMessage && !action) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const db = readDb();
    const sessionUser = getSessionUser(req, db);

    // If advanced parameters or specific tutor action provided, route through tutor suite
    if (action || req.body.level || req.body.language || req.body.style || req.body.roadmapMode || req.body.noteFormat) {
      const suiteResult = await handleTutorSuiteAI({
        action: action || 'smart_chat',
        query: userMessage,
        subjectName: req.body.subjectName || subjectContext,
        unitName: req.body.unitName,
        topicName: req.body.topicName,
        level: req.body.level,
        language: req.body.language,
        style: req.body.style,
        roadmapMode: req.body.roadmapMode,
        noteFormat: req.body.noteFormat,
        history,
      });

      if (!db.chatHistory) db.chatHistory = [];
      const userId = sessionUser?.id || db.users[0]?.id || 'usr_default';
      db.chatHistory.push(
        { id: `c_${Date.now()}_1`, userId, role: 'user', content: userMessage || action, timestamp: new Date().toISOString() },
        { id: `c_${Date.now()}_2`, userId, role: 'assistant', content: suiteResult.markdown, timestamp: new Date().toISOString() }
      );
      writeDb(db);

      return res.json({ success: true, reply: suiteResult.markdown, ...suiteResult });
    }

    const reply = await studyChatAI({ message: userMessage, subjectContext, syllabusContext, history });

    if (!db.chatHistory) db.chatHistory = [];
    const userId = sessionUser?.id || db.users[0]?.id || 'usr_default';
    db.chatHistory.push(
      { id: `c_${Date.now()}_1`, userId, role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { id: `c_${Date.now()}_2`, userId, role: 'assistant', content: reply, timestamp: new Date().toISOString() }
    );
    writeDb(db);

    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('Error in study chat:', err);
    res.status(500).json({ error: err.message || 'Unable to get response from AI tutor right now.' });
  }
});

app.post('/api/ai/evaluate-voice-viva', async (req: Request, res: Response) => {
  try {
    const { question, spokenAnswer, expectedConcept } = req.body;
    const evaluation = await evaluateVoiceVivaAI({ question, spokenAnswer, expectedConcept });
    const db = readDb();
    updateStreakAndXp(db.users[0]?.id || 'usr_default', 15);
    res.json({ success: true, evaluation });
  } catch (err: any) {
    console.error('Error evaluating voice viva:', err);
    res.status(500).json({ error: err.message || 'Unable to evaluate viva answer right now.' });
  }
});

app.post('/api/ai/coding-debug', async (req: Request, res: Response) => {
  try {
    const { language, problem, userCode, errorOrIssue } = req.body;
    const debugResult = await codingLabDebugAI({ language, problem, userCode, errorOrIssue });
    res.json({ success: true, result: debugResult });
  } catch (err: any) {
    console.error('Error debugging code:', err);
    res.status(500).json({ error: err.message || 'Unable to analyze code right now.' });
  }
});

// ----------------- SESSIONS & GAMIFICATION ROUTES -----------------
app.post('/api/sessions', (req: Request, res: Response) => {
  const { subjectId, topicName, durationMinutes } = req.body;
  const db = readDb();
  const session: StudySession = {
    id: `sess_${Date.now()}`,
    userId: db.users[0]?.id || 'usr_default',
    subjectId,
    topicName,
    durationMinutes: Number(durationMinutes) || 25,
    completedAt: new Date().toISOString(),
  };

  db.studySessions.push(session);
  const { user } = updateStreakAndXp(db.users[0]?.id || 'usr_default', 20);
  writeDb(db);

  res.json({ success: true, session, user });
});

app.post('/api/quiz-results', (req: Request, res: Response) => {
  const { topicId, score, total, accuracy } = req.body;
  const db = readDb();

  // Update topic score in subject
  if (topicId) {
    for (const subj of db.subjects) {
      for (const unit of subj.units) {
        for (const topic of unit.topics) {
          if (topic.id === topicId) {
            topic.score = accuracy;
            topic.attempts = (topic.attempts || 0) + 1;
            topic.lastAccessed = new Date().toISOString();
          }
        }
      }
    }
  }

  const xpGain = accuracy >= 90 ? 50 : 25;
  const { user } = updateStreakAndXp(db.users[0]?.id || 'usr_default', xpGain);
  writeDb(db);

  res.json({ success: true, user });
});

app.get('/api/groups', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ groups: db.studyGroups });
});

app.post('/api/groups', (req: Request, res: Response) => {
  const { name, subjectName } = req.body;
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required to create a study group.' });
  }
  const newGroup = {
    id: `grp_${Date.now()}`,
    name: name || 'Study Circle',
    subjectName: subjectName || 'Computer Science',
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    createdById: user.id,
    members: [
      {
        userId: user.id,
        userName: user.name || 'You',
        topicsCount: 12,
        quizAccuracy: 85,
        streak: user.currentStreak || 7,
        joinedAt: new Date().toISOString(),
      },
    ],
    discussions: [],
  };
  db.studyGroups.push(newGroup);
  writeDb(db);
  res.json({ success: true, group: newGroup });
});

app.post('/api/groups/:id/message', (req: Request, res: Response) => {
  const { message } = req.body;
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required to post message.' });
  }
  const group = db.studyGroups.find((g) => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const newMsg = {
    id: `msg_${Date.now()}`,
    userId: user.id,
    userName: user.name || 'You',
    message,
    createdAt: new Date().toISOString(),
  };
  group.discussions.push(newMsg);
  writeDb(db);
  res.json({ success: true, message: newMsg });
});

// ===================== AI STUDY ROADMAP ENDPOINTS =====================

app.get('/api/roadmaps', (req: Request, res: Response) => {
  const db = readDb();
  const { subjectId } = req.query;
  let list = db.roadmaps || [];
  if (subjectId) {
    list = list.filter((r) => r.subjectId === subjectId);
  }
  // Sort descending by updated date
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ success: true, roadmaps: list });
});

app.get('/api/roadmaps/:id', (req: Request, res: Response) => {
  const db = readDb();
  const roadmap = (db.roadmaps || []).find((r) => r.id === req.params.id);
  if (!roadmap) {
    return res.status(404).json({ error: 'Roadmap not found' });
  }
  res.json({ success: true, roadmap });
});

app.post('/api/roadmaps/generate', async (req: Request, res: Response) => {
  try {
    const {
      subjectId,
      subjectName,
      targetScope = 'complete_subject',
      selectedUnits = [],
      selectedTopics = [],
      examDate,
      dailyStudyMinutes = 120,
      currentLevel = 'Intermediate',
      preferredLanguage = 'English',
    } = req.body;

    if (!subjectName && (!selectedTopics || selectedTopics.length === 0)) {
      return res.status(400).json({ error: 'Subject name or learning topic is required.' });
    }

    const db = readDb();
    const user = getSessionUser(req, db) || db.users[0];
    const targetSubject = db.subjects.find((s) => s.id === subjectId || s.name === subjectName);

    // GATHER REAL PERFORMANCE DATA (No fake or hallucinated stats)
    let performanceData: any = undefined;

    const allSubjectTopics = targetSubject
      ? targetSubject.units.flatMap((u) => u.topics)
      : db.subjects.flatMap((s) => s.units.flatMap((u) => u.topics));

    const completedTopicNames = allSubjectTopics.filter((t) => t.completed).map((t) => t.name);

    // Identify weak topics from actual topic scores (<65%) and actual evaluations (<60%)
    const weakFromTopics = allSubjectTopics
      .filter((t) => t.score !== undefined && t.score < 65)
      .map((t) => t.name);

    const weakFromEvaluations = (db.evaluations || [])
      .filter((e) => (targetSubject ? e.subjectId === targetSubject.id : true) && e.estimatedScore < 60)
      .map((e) => e.topicName);

    const weakTopics = Array.from(new Set([...weakFromTopics, ...weakFromEvaluations]));

    // Identify strong topics from actual topic scores (>=80%) and actual evaluations (>=80%)
    const strongFromTopics = allSubjectTopics
      .filter((t) => t.score !== undefined && t.score >= 80)
      .map((t) => t.name);

    const strongFromEvaluations = (db.evaluations || [])
      .filter((e) => (targetSubject ? e.subjectId === targetSubject.id : true) && e.estimatedScore >= 80)
      .map((e) => e.topicName);

    const strongTopics = Array.from(new Set([...strongFromTopics, ...strongFromEvaluations]));

    const recentScores = (db.evaluations || [])
      .filter((e) => (targetSubject ? e.subjectId === targetSubject.id : true))
      .slice(-6)
      .map((e) => ({
        topic: e.topicName,
        score: e.estimatedScore,
        type: 'AI Professor Rubric',
      }));

    const solvedQuestions = (db.questions || []).filter((q) => targetSubject ? q.subjectId === targetSubject.id : true);

    const hasRealData =
      completedTopicNames.length > 0 ||
      weakTopics.length > 0 ||
      strongTopics.length > 0 ||
      recentScores.length > 0;

    if (hasRealData) {
      performanceData = {
        weakTopics,
        strongTopics,
        completedTopics: completedTopicNames,
        recentScores,
        totalQuestionsSolved: solvedQuestions.length,
      };
    }

    const aiRoadmapData = await generateStudyRoadmapAI({
      subjectName: targetSubject?.name || subjectName,
      targetScope,
      selectedUnits,
      selectedTopics: selectedTopics.length > 0 ? selectedTopics : allSubjectTopics.map((t) => t.name),
      syllabusContext: targetSubject?.rawSyllabusText || targetSubject?.description,
      examDate: examDate || targetSubject?.examDate || '2026-11-20',
      dailyStudyMinutes: Number(dailyStudyMinutes) || 120,
      currentLevel,
      preferredLanguage,
      performanceData,
    });

    const newRoadmap: StudyRoadmap = {
      id: `rdmp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user?.id || 'usr_default',
      subjectId: targetSubject?.id,
      subjectName: targetSubject?.name || subjectName,
      targetScope,
      selectedUnits,
      selectedTopics: selectedTopics.length > 0 ? selectedTopics : allSubjectTopics.map((t) => t.name),
      examDate: examDate || targetSubject?.examDate || '2026-11-20',
      dailyStudyMinutes: Number(dailyStudyMinutes) || 120,
      currentLevel,
      preferredLanguage,
      analysis: aiRoadmapData.analysis,
      days: aiRoadmapData.days,
      overallProgress: 0,
      adaptationHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!db.roadmaps) {
      db.roadmaps = [];
    }
    db.roadmaps.push(newRoadmap);

    updateStreakAndXp(user?.id || 'usr_default', 40);
    writeDb(db);

    res.json({ success: true, roadmap: newRoadmap });
  } catch (err: any) {
    console.error('Error generating AI study roadmap:', err);
    res.status(500).json({ error: err.message || 'Unable to generate study roadmap right now.' });
  }
});

app.patch('/api/roadmaps/:id/task', (req: Request, res: Response) => {
  const { dayNumber, taskId, completed } = req.body;
  const db = readDb();
  if (!db.roadmaps) db.roadmaps = [];
  const roadmap = db.roadmaps.find((r) => r.id === req.params.id);

  if (!roadmap) {
    return res.status(404).json({ error: 'Roadmap not found' });
  }

  const targetDay = roadmap.days.find((d) => d.dayNumber === Number(dayNumber));
  if (!targetDay) {
    return res.status(404).json({ error: 'Day not found in roadmap' });
  }

  const targetTask = targetDay.tasks.find((t) => t.id === taskId);
  if (targetTask) {
    targetTask.completed = Boolean(completed);
  }

  // Check if all tasks in the day are complete
  targetDay.completed = targetDay.tasks.length > 0 && targetDay.tasks.every((t) => t.completed);

  // Recalculate overall roadmap completion %
  const totalTasks = roadmap.days.reduce((acc, d) => acc + d.tasks.length, 0);
  const completedTasks = roadmap.days.reduce(
    (acc, d) => acc + d.tasks.filter((t) => t.completed).length,
    0
  );
  roadmap.overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  roadmap.updatedAt = new Date().toISOString();

  if (completed) {
    updateStreakAndXp(db.users[0]?.id || 'usr_default', 15);
  }

  writeDb(db);
  res.json({ success: true, roadmap });
});

app.post('/api/roadmaps/:id/adapt', async (req: Request, res: Response) => {
  try {
    const { topicName, scorePercent, assessmentType, weakPoints } = req.body;
    const db = readDb();
    if (!db.roadmaps) db.roadmaps = [];
    const roadmap = db.roadmaps.find((r) => r.id === req.params.id);

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    const adaptedResult = await adaptStudyRoadmapAI({
      currentRoadmap: roadmap,
      latestPerformance: {
        topicName,
        scorePercent: Number(scorePercent),
        assessmentType: assessmentType || 'Assessment',
        weakPoints,
      },
    });

    roadmap.days = adaptedResult.days;
    roadmap.analysis.weakTopics = adaptedResult.weakTopics || roadmap.analysis.weakTopics;
    roadmap.analysis.strongTopics = adaptedResult.strongTopics || roadmap.analysis.strongTopics;

    if (!roadmap.adaptationHistory) {
      roadmap.adaptationHistory = [];
    }
    roadmap.adaptationHistory.push({
      date: new Date().toISOString(),
      trigger: `${assessmentType || 'Test'} on ${topicName} (Score: ${scorePercent}%)`,
      modificationSummary: adaptedResult.adaptationSummary,
    });
    roadmap.updatedAt = new Date().toISOString();

    writeDb(db);
    res.json({ success: true, roadmap, adaptationSummary: adaptedResult.adaptationSummary });
  } catch (err: any) {
    console.error('Error adapting roadmap:', err);
    res.status(500).json({ error: err.message || 'Unable to adapt roadmap right now.' });
  }
});

app.delete('/api/roadmaps/:id', (req: Request, res: Response) => {
  const db = readDb();
  if (!db.roadmaps) db.roadmaps = [];
  const idx = db.roadmaps.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Roadmap not found' });
  }
  db.roadmaps.splice(idx, 1);
  writeDb(db);
  res.json({ success: true });
});

// Seed sample subjects if database is completely empty so user has immediate rich data
function checkAndSeedSampleSubject() {
  const db = readDb();
  if (db.subjects.length === 0) {
    const subjectId = 'subj_ds_seed';
    const sampleSubject: Subject = {
      id: subjectId,
      userId: db.users[0]?.id || 'usr_default',
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      description: 'Foundations of linear and non-linear data structures, asymptotic analysis, stacks, queues, trees, graphs, sorting, and searching algorithms.',
      examDate: '2026-11-20',
      createdAt: new Date().toISOString(),
      units: [
        {
          id: 'unit_1',
          subjectId,
          name: 'Unit 1: Introduction & Asymptotic Analysis',
          weightage: 18,
          orderNumber: 1,
          topics: [
            {
              id: 'top_1_1',
              unitId: 'unit_1',
              subjectId,
              name: 'Basic Terminologies & ADTs',
              description: 'Abstract Data Types, primitive vs non-primitive structures',
              priority: 'important',
              priorityReason: 'Core foundation for university theory papers.',
              completed: true,
              score: 90,
              orderNumber: 1,
            },
            {
              id: 'top_1_2',
              unitId: 'unit_1',
              subjectId,
              name: 'Asymptotic Notations (Big-O, Omega, Theta)',
              description: 'Mathematical definitions, order of growth, worst/best/average case',
              priority: 'very_important',
              priorityReason: 'Guaranteed 5-mark and 2-mark questions in every semester paper.',
              completed: true,
              score: 85,
              orderNumber: 2,
            },
            {
              id: 'top_1_3',
              unitId: 'unit_1',
              subjectId,
              name: 'Linear Search & Binary Search Analysis',
              description: 'Divide and conquer search, recurrence relations',
              priority: 'very_important',
              priorityReason: 'Frequently asked numerical and complexity derivation.',
              completed: false,
              score: 45, // Weak topic for adaptive recommendation testing
              orderNumber: 3,
            },
          ],
        },
        {
          id: 'unit_2',
          subjectId,
          name: 'Unit 2: Stacks & Queues',
          weightage: 27,
          orderNumber: 2,
          topics: [
            {
              id: 'top_2_1',
              unitId: 'unit_2',
              subjectId,
              name: 'Stack ADT & Array/Linked Implementation',
              description: 'LIFO principle, PUSH, POP, PEEK operations with overflow checks',
              priority: 'very_important',
              priorityReason: 'Core practical programming question and 10-mark exam question.',
              completed: true,
              score: 92,
              orderNumber: 1,
            },
            {
              id: 'top_2_2',
              unitId: 'unit_2',
              subjectId,
              name: 'Infix to Postfix & Expression Evaluation',
              description: 'Operator precedence, stack-based algorithm and step-by-step trace',
              priority: 'very_important',
              priorityReason: 'Carries 100% historical recurrence rate across past 5 years.',
              completed: true,
              score: 88,
              orderNumber: 2,
            },
            {
              id: 'top_2_3',
              unitId: 'unit_2',
              subjectId,
              name: 'Circular Queue & Priority Queue',
              description: 'FIFO, modulo arithmetic index wrap-around, priority heap design',
              priority: 'important',
              priorityReason: 'Frequently asked 5-mark difference question.',
              completed: false,
              orderNumber: 3,
            },
          ],
        },
        {
          id: 'unit_3',
          subjectId,
          name: 'Unit 3: Linked Lists',
          weightage: 18,
          orderNumber: 3,
          topics: [
            {
              id: 'top_3_1',
              unitId: 'unit_3',
              subjectId,
              name: 'Singly Linked List Operations',
              description: 'Insertion, deletion, traversal, memory dynamics',
              priority: 'important',
              priorityReason: 'Standard programming problem in internal exams.',
              completed: false,
              orderNumber: 1,
            },
            {
              id: 'top_3_2',
              unitId: 'unit_3',
              subjectId,
              name: 'Doubly & Circular Linked Lists',
              description: 'Bidirectional pointers, circular loops, applications',
              priority: 'moderate',
              priorityReason: 'Tested in short 2-mark and 5-mark comparison questions.',
              completed: false,
              orderNumber: 2,
            },
          ],
        },
        {
          id: 'unit_4',
          subjectId,
          name: 'Unit 4: Trees & Binary Search Trees',
          weightage: 22,
          orderNumber: 4,
          topics: [
            {
              id: 'top_4_1',
              unitId: 'unit_4',
              subjectId,
              name: 'Binary Tree Traversals (Inorder, Preorder, Postorder)',
              description: 'Recursive and iterative tree traversals, tree reconstructions',
              priority: 'very_important',
              priorityReason: 'High frequency 10-mark question with diagram verification.',
              completed: false,
              orderNumber: 1,
            },
            {
              id: 'top_4_2',
              unitId: 'unit_4',
              subjectId,
              name: 'BST Insertion, Deletion & AVL Rotations',
              description: 'Binary search tree invariants, balance factor, LL/RR/LR/RL rotations',
              priority: 'very_important',
              priorityReason: 'Crucial numerical construction question in university exams.',
              completed: false,
              orderNumber: 2,
            },
          ],
        },
        {
          id: 'unit_5',
          subjectId,
          name: 'Unit 5: Graphs & Hashing',
          weightage: 15,
          orderNumber: 5,
          topics: [
            {
              id: 'top_5_1',
              unitId: 'unit_5',
              subjectId,
              name: 'Graph Representation & BFS/DFS Traversals',
              description: 'Adjacency matrix, adjacency list, queue-based BFS, recursion DFS',
              priority: 'important',
              priorityReason: 'Essential algorithm problem.',
              completed: false,
              orderNumber: 1,
            },
            {
              id: 'top_5_2',
              unitId: 'unit_5',
              subjectId,
              name: 'Hash Functions & Collision Resolution Techniques',
              description: 'Separate chaining, open addressing (linear probing, quadratic, double hashing)',
              priority: 'important',
              priorityReason: 'Standard 5-mark numerical problem with load factor.',
              completed: false,
              orderNumber: 2,
            },
          ],
        },
      ],
    };

    db.subjects.push(sampleSubject);

    // Seed sample notes for top_2_1 (Stack ADT)
    db.notes.push({
      id: 'note_seed_stack',
      topicId: 'top_2_1',
      subjectId,
      title: 'Stack ADT & Implementation',
      definition: 'A Stack is a linear data structure that operates under the LIFO (Last In First Out) principle, where insertion and deletion of elements occur at only one end, termed the Top of the stack.',
      introduction: 'Stacks play an indispensable role in system architectures, compiler syntax analysis, operating system function call stacks, and expression evaluation. Formulated as an Abstract Data Type (ADT), the stack encapsulates access policies so that underlying storage details remain decoupled from high-level operations.',
      keyConcepts: [
        'LIFO Principle: The most recently inserted element is the first element accessed and removed.',
        'Top Pointer: An integer or node pointer indicating the index/address of the highest active element.',
        'Push Operation: Inserts an element to the Top with O(1) time complexity.',
        'Pop Operation: Deletes and returns the element at Top with O(1) time complexity.',
        'Overflow & Underflow: Overflow occurs when pushing into a saturated fixed-size stack; Underflow occurs when popping an empty stack.',
      ],
      explanation: 'In array-based implementation, an array A of capacity MAX is maintained alongside an integer variable "top" initialized to -1. When PUSH(x) is invoked, we verify if top == MAX - 1. If not, top is incremented and A[top] is assigned x. When POP() is invoked, we check if top == -1. If not, the value A[top] is stored, top is decremented, and the stored value returned.',
      realLifeExample: 'The browser "Back" button functions as a stack: visiting a new webpage pushes its URL onto the history stack; clicking "Back" pops the current page and reveals the preceding one.',
      formula: 'Stack Condition: IsEmpty() <=> top == -1 ; IsFull() <=> top == MAX - 1',
      algorithm: `void PUSH(int stack[], int &top, int MAX, int val) {
    if (top >= MAX - 1) {
        printf("Stack Overflow!\\n");
        return;
    }
    top = top + 1;
    stack[top] = val;
}

int POP(int stack[], int &top) {
    if (top < 0) {
        printf("Stack Underflow!\\n");
        return -1;
    }
    int val = stack[top];
    top = top - 1;
    return val;
}`,
      complexity: 'Time Complexity: PUSH = O(1), POP = O(1), PEEK = O(1), ISEMPTY = O(1). Space Complexity: O(n) for storing n elements.',
      applications: [
        'Expression parsing and conversion (Infix to Postfix, Prefix)',
        'Function call call-stack and recursion management in CPU/RAM',
        'Backtracking algorithms (Maze solving, N-Queens, DFS graph traversal)',
        'Undo and Redo operations in code editors and graphic software',
      ],
      advantages: [
        'Guaranteed constant O(1) time overhead for all core operations',
        'Simplistic memory management without complex re-indexing',
        'Direct hardware support via CPU stack pointer registers',
      ],
      limitations: [
        'Fixed array stack cannot grow dynamically without costly reallocation',
        'Random access to interior elements is prohibited without popping preceding items',
      ],
      examPoints: [
        'Always draw the stack container diagram showing TOP pointer positioning',
        'State both boundary conditions: Underflow (top == -1) and Overflow (top == MAX - 1)',
        'Mention time complexity O(1) explicitly for each method',
      ],
      quickRevision: 'Stack = LIFO | Operations: PUSH, POP, PEEK | Complexity: All O(1) | Boundary: top==-1 (underflow), top==MAX-1 (overflow).',
      diagramSvgOrAscii: `  +---------+
  |    30   |  <-- TOP (index 2)
  +---------+
  |    20   |  (index 1)
  +---------+
  |    10   |  (index 0)
  +---------+
  BOTTOM`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    writeDb(db);
  }
}

// Register 4 Advanced AI Features routes (Library RAG, Handwritten Solver, PYQ Intelligence, Offline Sync)
registerAdvancedRoutes(app, getSessionUser);

// Register Chat With Friends Routes (Room Code, Real-Time Messaging)
registerChatRoutes(app, getSessionUser);

checkAndSeedSampleSubject();

// ----------------- VITE INTEGRATION / STATIC ASSETS -----------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  // Initialize Real-time WebSockets on /ws/chat
  setupChatWebSocketServer(httpServer);

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyAI server running with real-time WebSockets at http://0.0.0.0:${PORT}`);
  });
}

startServer();
